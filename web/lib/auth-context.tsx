'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { socket } from './socket'
import toast from 'react-hot-toast'
import { usePathname, useRouter } from 'next/navigation'


type User = {
  id: number
  token: string | null
}

type AuthContextType = {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  isLoggedIn:boolean
  setIsLoggedIn: (isLoggedIn:boolean) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn,setIsLoggedIn] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const path = process.env.NEXT_PUBLIC_API!

  const authPaths = ["/login","/register"]
  const pathname = usePathname()
  const router= useRouter()


  useEffect(() => {
    async function loadUser() {
      try {
        const res = await axios.get(`${path}/auth/me`, {
          withCredentials: true,
        })

        if (!res.data.success) throw new Error("Please LogIn First")

        const userData = res.data.user
        setUser(userData)
        setIsLoggedIn(true)

        if (userData?.token) {
          socket.auth = { token: userData.token }
          if (!socket.connected) socket.connect()
        }
      } catch(err) {
        console.log(err)
        setUser(null)
        setIsLoggedIn(false)
        socket.disconnect()
        if(!authPaths.includes(pathname)){
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
  }, [path, pathname, router])

  return (
    <AuthContext.Provider value={{ user, loading, setUser,isLoggedIn,setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContex() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContex must be used inside AuthProvider')
  return ctx
}
