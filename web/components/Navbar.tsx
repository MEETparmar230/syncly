'use client'

import { useAuthContex } from '@/lib/auth-context'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { loading, isLoggedIn,setIsLoggedIn  } = useAuthContex()
  const router = useRouter()
  const path = process.env.NEXT_PUBLIC_API!
  

  const handleLogOut = async () => {
    await axios.get(`${path}/auth/logout`, { withCredentials: true })
    setIsLoggedIn(false)             
    router.push('/login')
  }

  if(loading){
    return (
      <div className="border-b py-1 text-zinc-200 flex justify-end items-center gap-5 px-20">
                            
       
          <a className=" bg-zinc-300 animate-pulse h-4 w-20 rounded" ></a>
          <a className=" bg-zinc-300 animate-pulse h-4 w-20 rounded" ></a>
        <button className=" bg-zinc-300 animate-pulse h-4 w-20 rounded" ></button>

    </div>
    )
  }

  return (
    <div className={`border-b border-zinc-500  py-1 text-zinc-200 flex justify-between items-center gap-5 md:ps-20 ps:4 pe-2 `}>
      <div>
        <img className=' h-10' src="/syncly.png" alt="SYncly logo" />
      </div>
      <div>
      {!isLoggedIn ? (                              
        <div className="mx-2">
          <a className="me-2 border border-zinc-500 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-900" href="/login">Login</a>
          <a className='border border-zinc-500 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-900' href="/register">Sign Up</a>
        </div>
      ) : (
        <button onClick={handleLogOut}>Log out</button>
      )}
      </div>
    </div>
  )
}
