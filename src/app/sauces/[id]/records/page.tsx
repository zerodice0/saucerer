'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'
import { useParams } from 'next/navigation'

interface Ingredient {
  id: string
  name: string
  amount: number
  unit: string
}

interface Sauce {
  id: string
  name: string
  ingredients: Ingredient[]
}

interface CookingRecord {
  id: string
  photo_url: string | null
  notes: string | null
  rating: number | null
  ingredient_amounts: Record<string, number>
  created_at: string
}

export default function CookingRecordsPage() {
  const params = useParams()
  const sauceId = params.id as string
  
  const [sauce, setSauce] = useState<Sauce | null>(null)
  const [cookingRecords, setCookingRecords] = useState<CookingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (sauceId) {
      fetchSauceDetails()
      fetchCookingRecords()
    }
  }, [sauceId])

  const fetchSauceDetails = async () => {
    const { data, error } = await supabase
      .from('sauces')
      .select(`
        *,
        ingredients (*)
      `)
      .eq('id', sauceId)
      .single()

    if (error) {
      console.error('Error fetching sauce:', error)
    } else {
      setSauce(data)
    }
  }

  const fetchCookingRecords = async () => {
    const { data, error } = await supabase
      .from('cooking_records')
      .select('*')
      .eq('sauce_id', sauceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cooking records:', error)
    } else {
      setCookingRecords(data || [])
    }
    setIsLoading(false)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getIngredientAmounts = (amounts: Record<string, number>) => {
    if (!sauce || !amounts) return []
    
    return sauce.ingredients.map(ingredient => ({
      name: ingredient.name,
      amount: amounts[ingredient.id] || 0,
      unit: ingredient.unit
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩중...</div>
      </div>
    )
  }

  if (!sauce) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">소스를 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/sauces/${sauceId}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {sauce.name}로 돌아가기
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {sauce.name} - 조리 기록
          </h1>

          {cookingRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">아직 조리 기록이 없습니다.</p>
              <Link href={`/sauces/${sauceId}`}>
                <Button>첫 조리 기록 추가하기</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {cookingRecords.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      {record.rating && renderStars(record.rating)}
                      <span className="text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 사진 */}
                    <div>
                      {record.photo_url ? (
                        <img
                          src={record.photo_url}
                          alt="조리 결과"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">사진 없음</span>
                        </div>
                      )}
                    </div>

                    {/* 메모 및 조미료 배합 */}
                    <div className="space-y-4">
                      {record.notes && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">메모</h3>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {record.notes}
                          </p>
                        </div>
                      )}

                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">사용한 조미료 배합</h3>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {getIngredientAmounts(record.ingredient_amounts).map((ingredient, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="text-gray-700">{ingredient.name}</span>
                                <span className="font-mono text-gray-900">
                                  {ingredient.amount.toFixed(2)} {ingredient.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}