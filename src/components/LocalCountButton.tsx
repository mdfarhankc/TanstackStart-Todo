import { createClientOnlyFn } from '@tanstack/react-start'
import { ClientOnly } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'

export default function LocalCountButton() {
  return (
    <ClientOnly>
      <ClientSection />
    </ClientOnly>
  )
}

function ClientSection() {
  const [count, setCount] = useState(loadCount)

  useEffect(() => {
    localStorage.setItem('count', count.toString())
  }, [count])
  return (
    <Button variant={'outline'} size={'sm'} onClick={() => setCount(count + 1)}>
      {count}
    </Button>
  )
}

const loadCount = createClientOnlyFn(() => {
  const localCount = localStorage.getItem('count')
  return localCount ? parseInt(localCount) : 0
})
