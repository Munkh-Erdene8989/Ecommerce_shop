'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ADMIN_PRODUCTS } from '@/lib/admin/graphql'

const productSchema = z.object({
  name: z.string().min(1, 'Нэр заавал'),
  slug: z.string().optional(),
  brand: z.string().default(''),
  category: z.string().default('skincare'),
  price: z.coerce.number().int().min(0),
  original_price: z.coerce.number().int().min(0).optional().nullable(),
  cost_price: z.coerce.number().int().min(0).optional().nullable(),
  image: z.string().url().optional().or(z.literal('')),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  description: z.string().default(''),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
})

type ProductFormData = z.infer<typeof productSchema>

const ADMIN_PRODUCT = gql`
  query AdminProduct($id: ID!) {
    adminProduct(id: $id) {
      id
      name
      slug
      brand
      category
      price
      original_price
      cost_price
      image
      stock_quantity
      description
      is_featured
      is_new
      is_bestseller
    }
  }
`

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
    }
  }
`

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const { data, loading: loadingProduct } = useQuery(ADMIN_PRODUCT, {
    variables: { id },
    skip: !id || id === 'new',
  })

  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [{ query: ADMIN_PRODUCTS, variables: { paging: { limit: 10, offset: 0 } } }],
  })

  const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: ADMIN_PRODUCTS, variables: { paging: { limit: 10, offset: 0 } } }],
  })

  const product = data?.adminProduct

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    values: product
      ? {
          name: product.name,
          slug: product.slug ?? '',
          brand: product.brand ?? '',
          category: product.category ?? 'skincare',
          price: product.price ?? 0,
          original_price: product.original_price ?? null,
          cost_price: product.cost_price ?? null,
          image: product.image ?? '',
          stock_quantity: product.stock_quantity ?? 0,
          description: product.description ?? '',
          is_featured: product.is_featured ?? false,
          is_new: product.is_new ?? false,
          is_bestseller: product.is_bestseller ?? false,
        }
      : undefined,
  })

  const onSubmit = async (data: ProductFormData) => {
    try {
      await updateProduct({
        variables: {
          input: {
            id,
            name: data.name,
            slug: data.slug || undefined,
            brand: data.brand || undefined,
            category: data.category,
            price: data.price,
            original_price: data.original_price ?? undefined,
            cost_price: data.cost_price ?? undefined,
            image: data.image || undefined,
            stock_quantity: data.stock_quantity,
            description: data.description,
            is_featured: !!data.is_featured,
            is_new: !!data.is_new,
            is_bestseller: !!data.is_bestseller,
          },
        },
      })
      toast.success('Хадгалагдлаа')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа гарлаа')
    }
  }

  const onDelete = async () => {
    try {
      await deleteProduct({ variables: { id } })
      toast.success('Устгагдлаа')
      setDeleteDialogOpen(false)
      router.push('/admin/products')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа гарлаа')
    }
  }

  if (loadingProduct && !product) {
    return <Skeleton className="h-96 w-full" />
  }
  if (!product && id !== 'new') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        Бүтээгдэхүүн олдсонгүй.
        <Button variant="outline" className="ml-2" onClick={() => router.push('/admin/products')}>
          Жагсаалт
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Бүтээгдэхүүн засах</h1>
      <Card>
        <CardHeader>
          <CardTitle>Үндсэн мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Нэр *</Label>
              <Input id="name" {...register('name')} className="mt-1" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register('slug')} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Брэнд</Label>
                <Input id="brand" {...register('brand')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="category">Категори</Label>
                <Input id="category" {...register('category')} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Үнэ (₮) *</Label>
                <Input id="price" type="number" {...register('price')} className="mt-1" />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
              </div>
              <div>
                <Label htmlFor="original_price">Жинхэнэ үнэ</Label>
                <Input id="original_price" type="number" {...register('original_price')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="cost_price">Зардлын үнэ</Label>
                <Input id="cost_price" type="number" {...register('cost_price')} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="stock_quantity">Нөөц</Label>
              <Input id="stock_quantity" type="number" {...register('stock_quantity')} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="image">Зургийн URL</Label>
              <Input id="image" {...register('image')} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Тайлбар</Label>
              <textarea id="description" {...register('description')} rows={3} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('is_featured')} />
                <span className="text-sm">Онцлох</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('is_new')} />
                <span className="text-sm">Шинэ</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('is_bestseller')} />
                <span className="text-sm">Хит</span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updating}>
                {updating ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
                Буцах
              </Button>
              <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                Устгах
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Бүтээгдэхүүн устгах</DialogTitle>
            <DialogDescription>
              Энэ бүтээгдэхүүнийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцааж болохгүй.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Цуцлах
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? 'Устгаж байна...' : 'Устгах'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
