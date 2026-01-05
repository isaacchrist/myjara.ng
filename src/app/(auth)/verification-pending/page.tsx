'use client'

import Link from 'next/link'
import { CheckCircle2, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

export default function VerificationPendingPage() {
    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
            <Card className="w-full max-w-lg border-emerald-100 shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                        <Mail className="h-8 w-8 text-emerald-600" />
                    </div>
                    <CardTitle className="text-2xl text-emerald-900">Registration Successful!</CardTitle>
                    <CardDescription className="text-lg">
                        Your account is currently under review.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center text-gray-600">
                    <p>
                        Thank you for signing up with MyJara. We need to verify your details to ensure the quality and security of our marketplace.
                    </p>
                    <div className="rounded-lg bg-gray-50 p-4 text-left text-sm">
                        <p className="font-medium text-gray-900 mb-2">Next Steps:</p>
                        <ul className="list-inside list-disc space-y-1">
                            <li>Our admin team will review your profile.</li>
                            <li>The verification process typically takes <strong>24 hours</strong>.</li>
                            <li>You will receive a confirmation email once approved.</li>
                        </ul>
                    </div>
                    <p className="text-sm">
                        While you wait, you can explore the marketplace as a customer.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/">
                            Explore MyJara <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
