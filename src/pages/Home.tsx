import React, { useRef } from 'react'

import ScannigSection from '../components/ScannigSection'
import DataSection from '../components/DataSection'



const Home: React.FC = () => {
  const searchFieldRef = useRef<HTMLInputElement>(null)

  return (
    <div className='w-full h-dvh p-10 flex justify-around bg-background font-base text-txt'>
      <ScannigSection searchFieldRef={searchFieldRef} />
      <DataSection searchFieldRef={searchFieldRef} />
    </div>
  )
}

export default Home
