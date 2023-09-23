import React from 'react'
import Image from 'next/image'

const Preloader = () => {
  return (
    <div className='bg-c0 fixed top-0 left-0 w-full h-full flex justify-center items-center'>
        <Image src = "/finalLoader.gif"  alt = "loading" width={80} height={80}/> 
    </div>
  )
}

export default Preloader
