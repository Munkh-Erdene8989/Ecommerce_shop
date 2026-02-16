'use client'

import { useRouter } from 'next/navigation'
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

const CREATE_PRODUCT = gql`
  mutation CreateOrUpdateProduct($input: CreateProductInput!) {
    createOrUpdateProduct(input: $input) {
      id
      name
      slug
    }
  }
`

export default function NewProductPage() {
  const router = useRouter()
  const [createProduct, { loading }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [{ query: ADMIN_PRODUCTS, variables: { paging: { limit: 10, offset: 0 } } }],
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      brand: '',
      category: 'skincare',
      price: 0,
      stock_quantity: 0,
      description: '',
      is_featured: false,
      is_new: false,
      is_bestseller: false,
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    try {
      const res = await createProduct({
        variables: {
          input: {
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
      const id = (res.data?.createOrUpdateProduct as { id: string })?.id
      toast.success('Бүтээгдэхүүн нэмэгдлээ')
      router.push(id ? `/admin/products/${id}` : '/admin/products')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа гарлаа')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Шинэ бүтээгдэхүүн</h1>
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
              <Input id="slug" {...register('slug')} className="mt-1" placeholder="автоматаар үүснэ" />
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
              <Button type="submit" disabled={loading}>
                {loading ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
                Буцах
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
