'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { ArrowLeft, Plus, Minus, Star } from 'lucide-react'
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

export default function SauceDetailPage() {
  const params = useParams()
  const sauceId = params.id as string
  
  const [sauce, setSauce] = useState<Sauce | null>(null)
  const [currentAmounts, setCurrentAmounts] = useState<{[key: string]: number}>({})
  const [cookingRecords, setCookingRecords] = useState<CookingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 새 조리 기록 폼
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [photoUrl, setPhotoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
      // 초기 조미료 양 설정
      const initialAmounts: {[key: string]: number} = {}
      data.ingredients.forEach((ing: Ingredient) => {
        initialAmounts[ing.id] = ing.amount
      })
      setCurrentAmounts(initialAmounts)
    }
    setIsLoading(false)
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
  }

  const adjustAmount = (ingredientId: string, change: number) => {
    setCurrentAmounts(prev => ({
      ...prev,
      [ingredientId]: Math.max(0, (prev[ingredientId] || 0) + change)
    }))
  }

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/'
        return
      }

      const { error } = await supabase
        .from('cooking_records')
        .insert({
          sauce_id: sauceId,
          user_id: user.id,
          photo_url: photoUrl || null,
          notes: notes || null,
          rating: rating || null,
          ingredient_amounts: currentAmounts
        })

      if (error) throw error

      // 폼 초기화
      setNotes('')
      setRating(0)
      setPhotoUrl('')
      fetchCookingRecords()
      
      alert('조리 기록이 저장되었습니다!')
    } catch (error: unknown) {
      console.error('Error saving cooking record:', error)
      alert(`조리 기록 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (currentRating: number, onRate?: (rating: number) => void) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate && onRate(star)}
            className={`${onRate ? 'cursor-pointer' : 'cursor-default'} ${
              star <= currentRating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            <Star className="h-5 w-5 fill-current" />
          </button>
        ))}
      </div>
    )
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
            href="/sauces"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            소스 목록으로 돌아가기
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 조미료 조절 패널 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{sauce.name}</h1>
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">조미료 양 조절</h2>
              
              {sauce.ingredients.map((ingredient) => (
                <div key={ingredient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{ingredient.name}</span>
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustAmount(ingredient.id, -0.25)}
                      className="p-1 h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-20 text-center font-mono">
                      {currentAmounts[ingredient.id]?.toFixed(2) || '0.00'} 큰술
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustAmount(ingredient.id, 0.25)}
                      className="p-1 h-8 w-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 조리 기록 추가 폼 */}
            <form onSubmit={handleSubmitRecord} className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">조리 결과 기록</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사진 URL (선택사항)
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  별점
                </label>
                {renderStars(rating, setRating)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모
                </label>
                <textarea
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={3}
                  placeholder="맛이나 개선점에 대한 메모를 남겨보세요..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? '저장중...' : '조리 결과 저장'}
              </Button>
            </form>
          </div>

          {/* 조리 기록 목록 */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-700">조리 기록</h2>
              <Link href={`/sauces/${sauceId}/records`}>
                <Button variant="outline" size="sm">
                  전체 보기
                </Button>
              </Link>
            </div>

            {cookingRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 조리 기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {cookingRecords.slice(0, 3).map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    {record.photo_url && (
                      <img
                        src={record.photo_url}
                        alt="조리 사진"
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    
                    {record.rating && (
                      <div className="mb-2">
                        {renderStars(record.rating)}
                      </div>
                    )}
                    
                    {record.notes && (
                      <p className="text-gray-700 text-sm mb-2">{record.notes}</p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      {new Date(record.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}