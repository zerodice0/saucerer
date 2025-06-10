'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  amount: number
}

export default function NewSaucePage() {
  const [sauceName, setSauceName] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', amount: 0 }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createSupabaseClient()

  const addIngredient = () => {
    const newId = Date.now().toString()
    setIngredients([...ingredients, { id: newId, name: '', amount: 0 }])
  }

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id))
    }
  }

  const updateIngredient = (id: string, field: 'name' | 'amount', value: string | number) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sauceName.trim()) {
      alert('소스 이름을 입력해주세요.')
      return
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim())
    if (validIngredients.length === 0) {
      alert('최소 하나의 조미료를 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/'
        return
      }

      const { data: sauce, error: sauceError } = await supabase
        .from('sauces')
        .insert({
          name: sauceName,
          user_id: user.id
        })
        .select()
        .single()

      if (sauceError) throw sauceError

      const ingredientData = validIngredients.map(ing => ({
        sauce_id: sauce.id,
        name: ing.name,
        amount: ing.amount,
        unit: '큰술'
      }))

      const { error: ingredientError } = await supabase
        .from('ingredients')
        .insert(ingredientData)

      if (ingredientError) throw ingredientError

      window.location.href = '/sauces'
    } catch (error: unknown) {
      console.error('Error creating sauce:', error)
      alert(`소스 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/sauces"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            소스 목록으로 돌아가기
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">새 소스 추가</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="sauceName" className="block text-sm font-medium text-gray-700 mb-2">
                소스 이름 *
              </label>
              <Input
                id="sauceName"
                type="text"
                placeholder="예: 떡볶이 소스, 칠리 소스"
                value={sauceName}
                onChange={(e) => setSauceName(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  조미료 *
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  조미료 추가
                </Button>
              </div>

              <div className="space-y-3">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="조미료 이름 (예: 고춧가루, 간장, 설탕)"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      <div className="flex">
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          placeholder="0"
                          value={ingredient.amount || ''}
                          onChange={(e) => updateIngredient(ingredient.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="rounded-r-none"
                        />
                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          큰술
                        </span>
                      </div>
                    </div>
                    {ingredients.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeIngredient(ingredient.id)}
                        className="p-2"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                * 1/4 큰술 단위로 입력 가능합니다 (예: 0.25, 0.5, 0.75, 1, 1.25...)
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Link href="/sauces">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '저장중...' : '소스 저장'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}