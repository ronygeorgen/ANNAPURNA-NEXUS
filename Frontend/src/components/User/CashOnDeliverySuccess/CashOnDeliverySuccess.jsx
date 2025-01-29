import { Button } from "@/components/ui/button"
import { CheckCircle } from 'lucide-react'
import { Link } from "react-router-dom";

export default function CashOnDeliverySuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Successful!</h1>
        <p className="text-gray-600 mb-6">Your cash on delivery order has been placed.</p>
        <Link to ="/home">
          <Button className="bg-orange-500 hover:bg-orange-600">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

