import React, { useState, useEffect } from 'react';
import { MapPin, Phone, User, Calendar, Eye } from 'lucide-react';
import api from '../../../services/api';
import { useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import AdminAside from '../AdminAside/AdminAside';
import AdminHeader from '../AdminHeader/AdminHeader';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const ShopDetails = () => {
    const [rationCards, setRationCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [verificationNote, setVerificationNote] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showRegisteredCards, setShowRegisteredCards] = useState(false);

    const { shopId } = useParams();

    const location = useLocation();
    const shop = location.state?.shop;

    const [selectedCardType, setSelectedCardType] = useState(null);
    const [cardTypes, setCardTypes] = useState([]);

    useEffect(() => {
        const fetchCardTypes = async () => {
            try {
                const response = await api.get('ration-card/card-types/');
                setCardTypes(response.data.cardType);
            } catch (error) {
                toast.error('Failed to fetch card types');
            }
        };
        fetchCardTypes();
    }, []);

    useEffect(() => {
        if (shop) {
            fetchRationCards();
        }
    }, [shop]);

    const fetchRationCards = async () => {
        try {
            const response = await api.get(`ration-card/fetch-shop-card-admin/${shop.shop_id}/`, { withCredentials: true });
            setRationCards(response.data.results);
            console.log('resulttttttt',response.data.results);
            
        } catch (error) {
            console.error('Error fetching ration cards:', error);
            toast.error('Failed to fetch ration cards');
        }
    };

    const getApprovalStatus = (adminApproved, shop_verification_notes) => {
        if (adminApproved && shop_verification_notes) {
            return <Badge className="bg-green-500">Fully Approved</Badge>;
        } else if (adminApproved || subAdminApproved) {
            return <Badge className="bg-orange-500">Partially Approved</Badge>;
        } else {
            return <Badge className="bg-red-500">Pending</Badge>;
        }
    };

    const handleCardView = (card) => {
        setSelectedCard(card);
    };

    const handleShopVerification = async () => {
        if (!verificationNote.trim()) {
            toast.error('Verification note is required');
            return;
        }

        try {
            const response = await api.patch(`ration-card/verify-card-admin/${selectedCard.card_number}/`, {
                status: 'ADMIN_APPROVED',
                admin_verification_notes: verificationNote,
                card_type: selectedCardType,
                admin_email: JSON.parse(JSON.parse(localStorage.getItem('persist:auth')).user).email
            }, { withCredentials: true });

            toast.success('Card verified successfully');
            
            const updatedCards = rationCards.map(card => 
                card.card_id === selectedCard.card_id 
                    ? { ...card, status: 'ADMIN_APPROVED', admin_verification_notes: verificationNote }
                    : card
            );
            setRationCards(updatedCards);

            setShowConfirmation(false);
            setSelectedCard(null);
        } catch (error) {
            console.error('Verification failed:', error);
            toast.error('Failed to verify card');
        }
    };

    if (loading) return (
        <div className="flex min-h-screen bg-teal-900">
            <AdminAside />
            <div className="flex-1">
                <AdminHeader />
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex min-h-screen bg-teal-900">
            <AdminAside />
            <div className="flex-1">
                <AdminHeader />
                <div className="text-red-500 text-center p-4">{error}</div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-teal-900">
            <AdminAside />
            <div className="flex-1">
                <div className="p-8">
                    <AdminHeader />
                    {shop && (
                        <div className="space-y-8">
                            <div className="bg-teal-800 bg-opacity-50 rounded-lg shadow-lg p-6 backdrop-blur-sm border border-teal-700">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold text-white">{shop?.name || 'No name'}</h2>
                                        {shop.description && (
                                            <p className="text-teal-300">{shop?.description || 'Description'}</p>
                                        )}
                                        <div className="space-y-2">
                                            <div className="flex items-center text-teal-300">
                                                <MapPin className="w-5 h-5 mr-2" />
                                                <span>{shop?.location || 'Location'}</span>
                                            </div>
                                            <div className="flex items-center text-teal-300">
                                                <Phone className="w-5 h-5 mr-2" />
                                                <span>{shop?.mobile_number || 'Mobile'}</span>
                                            </div>
                                            {shop.owner_name && (
                                                <div className="flex items-center text-teal-300">
                                                    <User className="w-5 h-5 mr-2" />
                                                    <span>{shop?.owner_name || 'Owner name'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <Button 
                                            onClick={() => setShowRegisteredCards(!showRegisteredCards)}
                                            className="mt-4 bg-teal-500 text-white hover:bg-teal-600"
                                        >
                                            {showRegisteredCards ? 'Requested Cards' : 'Registered Cards'}
                                        </Button>
                                    </div>
                                    <div className="relative h-48 md:h-full min-h-[200px]">
                                        {shop.profile_image ? (
                                            <img
                                                src={shop?.profile_image}
                                                alt={shop?.name}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
                                                <span className="text-teal-300">No image available</span>
                                            </div>
                                        )}
                                        <span 
                                            className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium
                                                ${shop.is_open 
                                                    ? 'bg-green-500 text-white' 
                                                    : 'bg-red-500 text-white'
                                                }`}
                                        >
                                            {shop.is_open ? 'Open' : 'Closed'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-teal-800 bg-opacity-50 rounded-lg shadow-lg overflow-hidden backdrop-blur-sm border border-teal-700">
                                <div className="p-4 border-b border-teal-700">
                                    <h3 className="text-xl font-semibold text-white">
                                        {showRegisteredCards ? 'Registered Cards' : 'Requested Cards'}
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-teal-300">Card Number</TableHead>
                                                <TableHead className="text-teal-300">Card Holder</TableHead>
                                                <TableHead className="text-teal-300">Created Date</TableHead>
                                                <TableHead className="text-teal-300">Approval Status</TableHead>
                                                <TableHead className="text-teal-300">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rationCards
                                                .filter(card => showRegisteredCards ? card.status === 'ADMIN_APPROVED' : card.status !== 'ADMIN_APPROVED')
                                                .map((card) => (
                                                <TableRow key={card?.card_id}>
                                                    <TableCell className="text-white">
                                                        {card?.card_number}
                                                    </TableCell>
                                                    <TableCell className="text-white">
                                                        {card?.head_name}
                                                    </TableCell>
                                                    <TableCell className="text-white">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-2 text-teal-300" />
                                                            {new Date(card?.created_at).toLocaleDateString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getApprovalStatus(card?.status, card?.shop_verification_notes)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            className="text-teal-300 border-teal-300 hover:bg-teal-300 hover:text-teal-900"
                                                            onClick={() => handleCardView(card)}
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedCard && (
                <Dialog open={selectedCard !== null} onOpenChange={() => setSelectedCard(null)}>
                    <DialogContent className="sm:max-w-[500px] bg-teal-800 text-white border-teal-700">
                        <DialogHeader>
                            <DialogTitle className="text-white">Card Details</DialogTitle>
                            <DialogDescription className="text-teal-300">
                                Detailed information for {selectedCard.head_name}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div className="bg-teal-700 bg-opacity-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2 text-white">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {[
                                        ['Card Number', selectedCard.card_number],
                                        ['Head Name', selectedCard.head_name],
                                        ['Age', selectedCard.head_age],
                                        ['Monthly Income', `₹${selectedCard.head_monthly_income}`],
                                        ['Head Aadhaar', selectedCard.head_aadhaar],
                                        ['Address', selectedCard.household_address]
                                    ].map(([label, value]) => (
                                        <React.Fragment key={label}>
                                            <div className="text-teal-300">{label}:</div>
                                            <div>{value}</div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2 text-white">Family Members</h3>
                                <ul className="list-disc list-inside text-teal-200">
                                    {selectedCard.family_members.map((member, index) => (
                                        <li key={index}>
                                            {member.name} ({member.age}, {member.relation})
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2 text-white">Requester Details</h3>
                                <div className="text-teal-300">
                                    {selectedCard.requester_email}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button 
                                variant="outline" 
                                className="text-teal-300 border-teal-300 hover:bg-teal-300 hover:text-teal-900"
                                onClick={() => setSelectedCard(null)}
                            >
                                Close
                            </Button>
                            {selectedCard.status !== 'ADMIN_APPROVED' && (
                                <Button 
                                    onClick={() => setShowConfirmation(true)}
                                    className="bg-teal-500 text-white hover:bg-teal-600"
                                >
                                    Verify Card
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent className="sm:max-w-[425px] bg-teal-800 text-white border-teal-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">Confirm Verification</DialogTitle>
                        <DialogDescription className="text-teal-300">
                            Are you sure you want to verify this ration card?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <div>
                            <span className='text-sm'>Choose Card Type</span>
                            <Select 
                                onValueChange={setSelectedCardType}
                                value={selectedCardType}
                            >
                                <SelectTrigger className="w-full bg-teal-700 text-white border-teal-600">
                                    <SelectValue placeholder="Select Card Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-teal-800 border-teal-600">
                                    {cardTypes.map((type) => (
                                        <SelectItem 
                                            key={type.name} 
                                            value={type.name}
                                            className="text-white hover:bg-teal-700"
                                        >
                                            {type.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='pt-5'>
                            <span className='text-sm'>Add verification note..</span>
                            <Input
                                value={verificationNote}
                                onChange={(e) => setVerificationNote(e.target.value)}
                                className="bg-teal-700 text-white border-teal-600 placeholder-teal-400"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline"
                            className="text-teal-300 border-teal-300 hover:bg-teal-300 hover:text-teal-900"
                            onClick={() => setShowConfirmation(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleShopVerification}
                            disabled={!verificationNote.trim()}
                            className="bg-teal-500 text-white hover:bg-teal-600"
                        >
                            Confirm Verification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ShopDetails;

