import React, { useState } from 'react';
import { ShoppingCart, X, Minus, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from 'react-router-dom';

export default function Cart({ 
    cartItems, 
    onRemoveItem, 
    onUpdateQuantity ,
    onIncreaseQuantity,
    shop,
    cardDetails
}) {

    const navigate = useNavigate()

    const calculateTotalItems = () => {
        return cartItems.length;
    };

    const calculateTotalAmount = () => {
        return cartItems.reduce((total, item) => total + (item.price_per_unit * item.quantity), 0);
    };

    if (cartItems.length === 0) {
        return null;
    }

    return (
        <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Cart</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px] w-full pr-4">
                    {cartItems.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            Your cart is empty
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div 
                                key={item.item_name}
                                className="flex items-center space-x-4 py-4 border-b last:border-b-0"
                            >
                                <div className="h-16 w-16 rounded bg-orange-100 flex items-center justify-center">
                                    <ShoppingCart className="text-orange-500" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-medium leading-none">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                    ₹{item.price_per_unit}/{item.item_unit} • Total: ₹{(item.price_per_unit * item.quantity).toFixed(2)}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-6 w-6"
                                            onClick={() => onUpdateQuantity(item, item.quantity - 1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm">{item.quantity} {item.item_unit}</span>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-6 w-6"
                                            onClick={() => onIncreaseQuantity(item, item.quantity + 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => onRemoveItem(item)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <div className="flex justify-between">
                    <span className="font-medium">Total Items: <span>{calculateTotalItems()}</span>  </span>
                    
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Total Amount: <span>₹{calculateTotalAmount()}</span></span>
                    
                </div>
                <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={cartItems.length === 0}
                    onClick={() => navigate('/home/selected-shop/choose-subsidies/checkout-page/', { 
                        state: { 
                            cartItems, 
                            shop:shop, 
                            cardDetails:cardDetails 
                        } 
                    })}
                >
                    <CreditCard className="mr-2 h-4 w-4" /> Checkout
                </Button>
            </CardFooter>
        </Card>
    );
}