import { useState, useEffect } from 'react'
import { Search, Filter, Eye, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '../../../features/auth/authSlice'
import { useDispatch } from 'react-redux'
import SubAdminAside from '../SubAdminAside/SubAdminAside'
import { toast } from 'react-toastify'
import api from '../../../services/api'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

// Mock data (unchanged)
// const rationCards = [
//     {
//       cardNumber: "RC001",
//       headName: "John Doe",
//       shopName: "Shop A",
//       status: "PENDING",
//       income: 25000,
//       age: 45,
//       address: "123 Main St, City",
//       requestedBy: "xyz@gmail.com",
//       familyMembers: [
//         { name: "Jane Doe", age: 40, relation: "Spouse" }
//       ],
//       documents: ["aadhar.pdf", "income.pdf"],
//       verificationHistory: [
//         { date: "2024-01-15", status: "PENDING", notes: "Documents submitted" }
//       ]
//     },
//     {
//       cardNumber: "RC002",
//       headName: "Alice Smith",
//       shopName: "Shop B",
//       status: "SHOP_VERIFIED",
//       income: 30000,
//       age: 38,
//       address: "456 Elm St, Town",
//       familyMembers: [
//         { name: "Bob Smith", age: 40, relation: "Spouse" },
//         { name: "Charlie Smith", age: 10, relation: "Child" }
//       ],
//       documents: ["aadhar.pdf", "income.pdf", "residence.pdf"],
//       requestedBy: 'xyz@gmail.com',
//       verificationHistory: [
//         { date: "2024-01-10", status: "PENDING", notes: "Documents submitted" },
//         { date: "2024-01-18", status: "SHOP_VERIFIED", notes: "Verified by shop owner" }
//       ]
//     },
//     {
//       cardNumber: "RC003",
//       headName: "Eva Johnson",
//       shopName: "Shop C",
//       status: "ADMIN_APPROVED",
//       income: 22000,
//       age: 52,
//       address: "789 Oak St, Village",
//       familyMembers: [
//         { name: "David Johnson", age: 55, relation: "Spouse" },
//         { name: "Fiona Johnson", age: 18, relation: "Child" }
//       ],
//       documents: ["aadhar.pdf", "income.pdf", "residence.pdf"],
//       requestedBy: 'xyz@gmail.com',
//       verificationHistory: [
//         { date: "2024-01-05", status: "PENDING", notes: "Documents submitted" },
//         { date: "2024-01-12", status: "SHOP_VERIFIED", notes: "Verified by shop owner" },
//         { date: "2024-01-20", status: "ADMIN_APPROVED", notes: "Approved by admin" }
//       ]
//     }
//   ]

export default function SubAdminCardList() {
  const [rationCards, setRationCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedCard, setSelectedCard] = useState(null)
  const [verificationNote, setVerificationNote] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRationCards = async () => {
      try {
        const response = await api.get('/ration-card/fetch/')
        setRationCards(response.data.results)
        setLoading(false)
      } catch (error) {
        toast.error('Failed to fetch ration cards')
        setLoading(false)
        console.log(error.response);
            
      }
    }
    fetchRationCards()
  }, [])

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      navigate('/sub-admin-login')
      toast.success('Logout successful!')
    } catch (error) {
      const errorMessage = error.non_field_errors ? error.non_field_errors[0] : 'An error occured';
      toast.error(`Logout failed: ${errorMessage} `)
      console.error("Logout failed", error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "SHOP_VERIFIED": return "bg-blue-100 text-blue-800 border-blue-300"
      case "ADMIN_APPROVED": return "bg-green-100 text-green-800 border-green-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const filteredCards = rationCards.filter(card => 
    (card.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
     card.head_name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "ALL" || card.status === statusFilter)
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SubAdminAside handleLogout={handleLogout}/>
      <div className="p-8 bg-gradient-to-br from-teal-50 to-white min-h-screen flex-1">
        <h1 className="text-3xl font-bold text-teal-800 mb-8">Ration Card Management</h1>
        
        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by card number or name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SHOP_VERIFIED">Shop Verified</SelectItem>
              <SelectItem value="ADMIN_APPROVED">Admin Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards Grid */}
        {/* <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredCards.map((card) => (
            <motion.div
              key={card.cardNumber}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">#{card.cardNumber}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(card.status)}`}>
                      {card.status.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="mb-2">{card.headName}</CardTitle>
                  <p className="text-gray-600 mb-4">{card.shopName}</p>
                  <Button 
                    variant="outline" 
                    className="w-full bg-teal-500 text-white hover:bg-teal-600"
                    onClick={() => setSelectedCard(card)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div> */}

        {filteredCards.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No ration cards found
          </div>
        ) : (
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredCards.map((card) => (
              <motion.div
                key={card.card_number}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">#{card.card_number}</span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(card.status)}`}>
                        {card.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-2">{card.head_name}</CardTitle>
                    <p className="text-gray-600 mb-4">{card.household_address}</p>
                    <Button 
                      variant="outline" 
                      className="w-full bg-teal-500 text-white hover:bg-teal-600"
                      onClick={() => setSelectedCard(card)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Detail Modal */}
        <Dialog open={selectedCard !== null} onOpenChange={(open) => !open && setSelectedCard(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Card Details</DialogTitle>
              <DialogDescription>
                Ration card information for {selectedCard?.head_name}
              </DialogDescription>
            </DialogHeader>
            {selectedCard && (
              <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Card Number:</div>
                    <div>{selectedCard.card_number}</div>
                    <div>Head Name:</div>
                    <div>{selectedCard.head_name}</div>
                    <div>Age:</div>
                    <div>{selectedCard.head_age}</div>
                    <div>Income:</div>
                    <div>₹{selectedCard.head_monthly_income}</div>
                    <div>Head Aadhaar:</div>
                    <div>₹{selectedCard.head_aadhaar}</div>
                    <div>Address:</div>
                    <div>{selectedCard.household_address}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Family Members</h3>
                  <ul className="list-disc list-inside">
                    {selectedCard.family_members.map((member, index) => (
                      <li key={index}>{member.name} ({member.age}, {member.relation})</li>
                    ))}
                  </ul>
                </div>
                {/* <div>
                  <h3 className="font-semibold mb-2">Documents</h3>
                  <ul className="list-disc list-inside">
                    {selectedCard.documents.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </div> */}
                <div>
                  <h3 className="font-semibold mb-2">Requested User Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>{selectedCard.requester_email}</div>
                    
                  </div>
                </div>

                {/* <div>
                  <h3 className="font-semibold mb-2">Verification History</h3>
                  <ul className="space-y-2">
                    {selectedCard.verificationHistory.map((history, index) => (
                      <li key={index} className="bg-gray-50 p-2 rounded text-sm">
                        <div>{history.date}: <span className={`font-medium ${getStatusColor(history.status)}`}>{history.status}</span></div>
                        <div>{history.notes}</div>
                      </li>
                    ))}
                  </ul>
                </div> */}

                <div>
                  <h3 className="font-semibold mb-2">Verification History</h3>
                  <div className="text-sm text-gray-600">
                    Status: <span className={`font-medium ${getStatusColor(selectedCard.status)}`}>
                      {selectedCard.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCard(null)}>Close</Button>
              <Button onClick={() => setShowConfirmation(true)}>Verify</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Modal */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                Are you sure you want to proceed with this action?
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Input
                placeholder="Add verification notes..."
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>Cancel</Button>
              <Button onClick={() => {
                // Handle confirmation
                setShowConfirmation(false)
                setSelectedCard(null)
                // Add logic to update the card status and add verification notes
              }}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}