import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sistema de Votación de la Iglesia</CardTitle>
          <CardDescription className="text-center">Panel de Administración</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Link href="/anfitrion" className="w-full">
            <Button className="w-full text-lg py-4 md:py-6">
              Acceso Anfitrión
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

