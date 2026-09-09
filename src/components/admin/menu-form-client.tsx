'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Menu, Category } from '@/types'
import { menuSchema, type MenuFormData } from '@/lib/validations'
import { generateSlug } from '@/lib/utils'
import { GlassCard } from '@/components/shared/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROUTES, STORAGE_BUCKETS, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/constants'
import { ArrowLeft, Upload, Loader2, Star } from 'lucide-react'
import Link from 'next/link'

interface MenuFormClientProps {
  menu?: Menu
  categories: Category[]
}

export function MenuFormClient({ menu, categories }: MenuFormClientProps) {
  const router = useRouter()
  const isEdit = !!menu
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(menu?.image_url ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues: menu
      ? {
          name: menu.name,
          description: menu.description ?? '',
          price: menu.price,
          category_id: menu.category_id,
          stock_status: menu.stock_status,
          is_active: menu.is_active,
          is_best_seller: menu.is_best_seller,
        }
      : {
          stock_status: 'AVAILABLE',
          is_active: true,
          is_best_seller: false,
        },
  })

  const isBestSeller = watch('is_best_seller')
  const isActive = watch('is_active')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Format gambar tidak valid (JPG, PNG, WebP)')
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Ukuran gambar maksimal ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB`)
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: MenuFormData) => {
    setLoading(true)
    try {
      const supabase = createClient()
      let image_url = menu?.image_url ?? null

      // Upload image if new file
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.MENU_IMAGES)
          .upload(path, imageFile, { upsert: true })
        if (uploadError) throw new Error('Gagal upload gambar: ' + uploadError.message)
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKETS.MENU_IMAGES)
          .getPublicUrl(uploadData.path)
        image_url = urlData.publicUrl
      }

      const slug = generateSlug(data.name)
      const payload = { ...data, slug, image_url }

      if (isEdit && menu) {
        const { error } = await supabase.from('menus').update(payload).eq('id', menu.id)
        if (error) throw error
        toast.success('Menu berhasil diperbarui')
      } else {
        const { error } = await supabase.from('menus').insert(payload)
        if (error) throw error
        toast.success('Menu berhasil ditambahkan')
      }

      router.push(ROUTES.ADMIN_MENUS)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan menu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.ADMIN_MENUS}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Menu' : 'Tambah Menu'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Image Upload */}
        <GlassCard className="p-4">
          <Label>Foto Menu</Label>
          <div className="mt-2 flex flex-col items-center gap-3">
            {imagePreview ? (
              <div className="relative h-32 w-32 overflow-hidden rounded-xl">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-gray-100 text-gray-300">
                <Upload className="h-10 w-10" />
              </div>
            )}
            <label className="cursor-pointer">
              <span className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600">
                {imagePreview ? 'Ganti Foto' : 'Pilih Foto'}
              </span>
              <input
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col gap-3">
          <div>
            <Label htmlFor="name">Nama Menu *</Label>
            <Input id="name" {...register('name')} placeholder="Nasi Goreng Spesial" className="mt-1" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Deskripsi singkat menu..."
              rows={2}
              className="mt-1 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="price">Harga (Rp) *</Label>
            <Input
              id="price"
              type="number"
              min={0}
              {...register('price', { valueAsNumber: true })}
              placeholder="25000"
              className="mt-1"
            />
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
          </div>

          <div>
            <Label>Kategori *</Label>
            <Select
              onValueChange={(v) => setValue('category_id', v as string)}
              defaultValue={menu?.category_id ?? undefined}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>}
          </div>

          <div>
            <Label>Status Stok</Label>
            <Select
              onValueChange={(v) => setValue('stock_status', v as MenuFormData['stock_status'])}
              defaultValue={menu?.stock_status ?? 'AVAILABLE'}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Masih Banyak</SelectItem>
                <SelectItem value="LOW_STOCK">Sedikit Lagi</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Habis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-300" />
              <Label htmlFor="best-seller" className="cursor-pointer text-sm">Best Seller</Label>
            </div>
            <Switch
              id="best-seller"
              checked={isBestSeller}
              onCheckedChange={(v) => setValue('is_best_seller', v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2">
            <Label htmlFor="is-active" className="cursor-pointer text-sm">Menu Aktif</Label>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={(v) => setValue('is_active', v)}
            />
          </div>
        </GlassCard>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 bg-[var(--color-primary,#f97316)] hover:opacity-90 text-white font-semibold"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isEdit ? 'Simpan Perubahan' : 'Tambah Menu'}
        </Button>
      </form>
    </div>
  )
}
