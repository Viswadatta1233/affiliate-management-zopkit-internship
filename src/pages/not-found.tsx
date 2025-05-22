import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tighter">Page Not Found</h1>
        <p className="text-lg text-muted-foreground">
          Sorry, we couldn't find the page you're looking for.
          
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings/general">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}