'use client'

import { useEffect, useState } from 'react'
import { api, Sauce, User } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus, ChefHat, LogOut } from 'lucide-react'

export default function SaucesPage() {
  const [sauces, setSauces] = useState<Sauce[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    checkUser()
    fetchSauces()
  }, [])

  const checkUser = async () => {
    const { data, error } = await api.auth.getCurrentUser()
    if (error || !data) {
      window.location.href = '/'
      return
    }
    setUser(data)
  }

  const fetchSauces = async () => {
    const { data, error } = await api.sauces.list()

    if (error) {
      console.error('Error fetching sauces:', error)
    } else {
      setSauces(data || [])
    }
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await api.auth.logout()
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Saucerer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">
              나의 소스 레시피
            </h2>
            <Link href="/sauces/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                새 소스 추가
              </Button>
            </Link>
          </div>

          {sauces.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                소스가 없습니다
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                첫 번째 소스 레시피를 추가해보세요!
              </p>
              <div className="mt-6">
                <Link href="/sauces/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    소스 추가하기
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sauces.map((sauce) => (
                <Link
                  key={sauce.id}
                  href={`/sauces/${sauce.id}`}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <div className="flex-shrink-0">
                    <ChefHat className="h-10 w-10 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">
                      {sauce.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {new Date(sauce.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
