import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Leaf, Plus, Trash2, Upload, WheatOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form'
import { createDish, updateDish, uploadImage } from '@/lib/staff'
import { dishSchema, validate } from '@/lib/schemas'
import { cn } from '@/lib/cn'
import type { AdminDish, Category, DishInput, Ingredient } from '@/types/api'

interface RecipeRow {
  ingredientId: string
  quantity: string
}

interface DishFormProps {
  dish?: AdminDish
  categories: Category[]
  ingredients: Ingredient[]
  onDone: () => void
  onCancel: () => void
}

const TAGS: Array<{
  key: 'spicy' | 'vegetarian' | 'glutenFree'
  label: string
  Icon: React.ComponentType<{ className?: string }>
  color: string
}> = [
  {
    key: 'spicy',
    label: 'menu.spicy',
    Icon: Flame,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
  },
  {
    key: 'vegetarian',
    label: 'menu.vegetarian',
    Icon: Leaf,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    key: 'glutenFree',
    label: 'menu.glutenFree',
    Icon: WheatOff,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
]

export function DishForm({ dish, categories, ingredients, onDone, onCancel }: DishFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(dish?.name ?? '')
  const [description, setDescription] = useState(dish?.description ?? '')
  const [price, setPrice] = useState(dish ? String(Number(dish.price)) : '')
  const [categoryId, setCategoryId] = useState(dish?.categoryId ?? categories[0]?.id ?? '')
  const [imageUrl, setImageUrl] = useState(dish?.imageUrl ?? '')
  const [sortOrder, setSortOrder] = useState(String(dish?.sortOrder ?? 0))
  const [allergens, setAllergens] = useState((dish?.allergens ?? []).join(', '))
  const [available, setAvailable] = useState(dish?.isAvailable ?? true)
  const [outOfStock, setOutOfStock] = useState(dish?.isOutOfStock ?? false)
  const [spicy, setSpicy] = useState(dish?.isSpicy ?? false)
  const [vegetarian, setVegetarian] = useState(dish?.isVegetarian ?? false)
  const [glutenFree, setGlutenFree] = useState(dish?.isGlutenFree ?? false)
  const [recipe, setRecipe] = useState<RecipeRow[]>(
    (dish?.dishIngredients ?? []).map((item) => ({
      ingredientId: item.ingredientId,
      quantity: String(Number(item.quantity)),
    }))
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      setImageUrl(await uploadImage(file))
    } catch {
      setError('staff.error')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    const parsed = {
      name: name.trim(),
      price: Number(price),
      imageUrl: imageUrl.trim() || null,
      categoryId,
      sortOrder: Number(sortOrder) || 0,
      allergens: allergens
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      recipe: recipe
        .filter((row) => row.ingredientId && row.quantity !== '')
        .map((row) => ({ ingredientId: row.ingredientId, quantity: Number(row.quantity) })),
    }
    const invalid = validate(dishSchema, parsed)
    if (invalid) {
      setError(invalid)
      return
    }

    setSaving(true)
    setError(null)

    const input: DishInput = {
      name: parsed.name,
      price: parsed.price,
      imageUrl: parsed.imageUrl,
      categoryId: parsed.categoryId,
      sortOrder: parsed.sortOrder,
      allergens: parsed.allergens,
      description: description.trim() || null,
      isAvailable: available,
      isOutOfStock: outOfStock,
      isSpicy: spicy,
      isVegetarian: vegetarian,
      isGlutenFree: glutenFree,
      ingredients: parsed.recipe,
    }

    try {
      if (dish) await updateDish(dish.id, input)
      else await createDish(input)
      onDone()
    } catch {
      setError('staff.error')
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (key: 'spicy' | 'vegetarian' | 'glutenFree') => {
    if (key === 'spicy') setSpicy(!spicy)
    if (key === 'vegetarian') setVegetarian(!vegetarian)
    if (key === 'glutenFree') setGlutenFree(!glutenFree)
  }

  const isTagActive = (key: 'spicy' | 'vegetarian' | 'glutenFree') => {
    if (key === 'spicy') return spicy
    if (key === 'vegetarian') return vegetarian
    return glutenFree
  }

  return (
    <div className="space-y-3">
      <Field label={t('staff.admin.dishes.name')}>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>

      <Field label={t('staff.admin.dishes.description')}>
        <Textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('staff.admin.dishes.price')}>
          <Input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </Field>
        <Field label={t('staff.admin.dishes.category')}>
          <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t('staff.admin.dishes.image')}>
        <div className="flex items-center gap-3">
          <div className="relative">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50 text-slate-400 text-xl font-semibold">
                {name.slice(0, 1).toUpperCase() || '—'}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                <span className="text-sm text-white">Subiendo…</span>
              </div>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors">
            <Upload className="h-4 w-4" aria-hidden />
            {uploading ? t('staff.admin.dishes.uploading') : t('staff.admin.dishes.upload')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>
        </div>
      </Field>

      <Field label={t('staff.admin.dishes.allergens')} hint={t('staff.admin.dishes.allergensHint')}>
        <Input value={allergens} onChange={(event) => setAllergens(event.target.value)} />
      </Field>

      <Field label={t('staff.admin.dishes.sortOrder')}>
        <Input
          type="number"
          inputMode="numeric"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        />
      </Field>

      {/* Etiquetas de dieta */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">{t('staff.admin.dishes.available')}</p>
        <div className="grid grid-cols-3 gap-2">
          {TAGS.map((tag) => {
            const active = isTagActive(tag.key)
            const Icon = tag.Icon as React.ComponentType<{ className?: string }>
            return (
              <button
                key={tag.key}
                type="button"
                onClick={() => toggleTag(tag.key)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600',
                  active
                    ? cn(tag.color, 'border-transparent shadow-sm')
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(tag.label)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            label={t('staff.admin.dishes.available')}
            checked={available}
            onChange={setAvailable}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            label={t('staff.admin.dishes.outOfStock')}
            checked={outOfStock}
            onChange={setOutOfStock}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">{t('staff.admin.dishes.recipe')}</p>
        <div className="mt-2 space-y-2">
          {recipe.map((row, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2"
            >
              <Select
                aria-label={t('staff.admin.dishes.ingredient')}
                value={row.ingredientId}
                onChange={(event) =>
                  setRecipe((rows) =>
                    rows.map((item, i) =>
                      i === index ? { ...item, ingredientId: event.target.value } : item
                    )
                  )
                }
              >
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} ({ingredient.unit})
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                step="0.001"
                aria-label={t('staff.admin.dishes.quantity')}
                className="w-24"
                value={row.quantity}
                onChange={(event) =>
                  setRecipe((rows) =>
                    rows.map((item, i) =>
                      i === index ? { ...item, quantity: event.target.value } : item
                    )
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('staff.admin.delete')}
                onClick={() => setRecipe((rows) => rows.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4 text-rose-600" aria-hidden />
              </Button>
            </motion.div>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={ingredients.length === 0}
          onClick={() =>
            setRecipe((rows) => [
              ...rows,
              { ingredientId: ingredients[0]?.id ?? '', quantity: '1' },
            ])
          }
          className="mt-2 flex items-center gap-2 text-sm font-semibold rounded-xl border border-line bg-slate-50 px-3 py-2 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.dishes.addIngredient')}
        </motion.button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {t(error)}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
        <Button variant="secondary" onClick={onCancel}>
          {t('staff.admin.cancel')}
        </Button>
        <Button
          onClick={() => void save()}
          disabled={saving || uploading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? t('staff.admin.saving') : t('staff.admin.save')}
        </Button>
      </div>
    </div>
  )
}
