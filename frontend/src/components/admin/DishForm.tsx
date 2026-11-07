import { useState } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form'
import { createDish, updateDish, uploadImage } from '@/lib/staff'
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
  const [error, setError] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(false)
    try {
      setImageUrl(await uploadImage(file))
    } catch {
      setError(true)
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setError(false)

    const input: DishInput = {
      name,
      description: description.trim() || null,
      price: Number(price),
      imageUrl: imageUrl.trim() || null,
      isAvailable: available,
      isOutOfStock: outOfStock,
      isSpicy: spicy,
      isVegetarian: vegetarian,
      isGlutenFree: glutenFree,
      allergens: allergens
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      sortOrder: Number(sortOrder) || 0,
      categoryId,
      ingredients: recipe
        .filter((row) => row.ingredientId && row.quantity !== '')
        .map((row) => ({ ingredientId: row.ingredientId, quantity: Number(row.quantity) })),
    }

    try {
      if (dish) await updateDish(dish.id, input)
      else await createDish(input)
      onDone()
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  const canSave = name.trim().length > 0 && categoryId !== '' && Number(price) > 0

  return (
    <div className="space-y-3">
      <Field label={t('staff.admin.dishes.name')}>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>

      <Field label={t('staff.admin.dishes.description')}>
        <Textarea
          rows={2}
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
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface text-xs text-muted">
              —
            </span>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-medium hover:bg-surface">
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

      <div className="grid grid-cols-2 gap-2">
        <Checkbox
          label={t('staff.admin.dishes.available')}
          checked={available}
          onChange={setAvailable}
        />
        <Checkbox
          label={t('staff.admin.dishes.outOfStock')}
          checked={outOfStock}
          onChange={setOutOfStock}
        />
        <Checkbox label={t('menu.spicy')} checked={spicy} onChange={setSpicy} />
        <Checkbox label={t('menu.vegetarian')} checked={vegetarian} onChange={setVegetarian} />
        <Checkbox label={t('menu.glutenFree')} checked={glutenFree} onChange={setGlutenFree} />
      </div>

      <div>
        <p className="text-sm font-medium">{t('staff.admin.dishes.recipe')}</p>
        <div className="mt-2 space-y-2">
          {recipe.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          disabled={ingredients.length === 0}
          onClick={() =>
            setRecipe((rows) => [
              ...rows,
              { ingredientId: ingredients[0]?.id ?? '', quantity: '1' },
            ])
          }
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.dishes.addIngredient')}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {t('staff.error')}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-line pt-3">
        <Button variant="secondary" onClick={onCancel}>
          {t('staff.admin.cancel')}
        </Button>
        <Button onClick={() => void save()} disabled={saving || uploading || !canSave}>
          {saving ? t('staff.admin.saving') : t('staff.admin.save')}
        </Button>
      </div>
    </div>
  )
}
