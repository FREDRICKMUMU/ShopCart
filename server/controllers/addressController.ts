import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

interface AuthRequest extends Request {
    user?: {
        id: string;
        isAdmin?: boolean;
    }
}

// GET USER ADDRESS
// GET /api/addresses
export const getAddresses = async (req: AuthRequest, res: Response) => {
    const addresses = await prisma.address.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "asc" }
    });
    res.json({ addresses });
}

// ADD ADDRESS
// POST /api/addresses
export const addAddress = async (req: AuthRequest, res: Response) => {
    const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

    // REQUIRE COORDINATES
    if (lat == null || lng == null) {
        return res.status(400).json({ message: "Location coordinates are required. Please allow location access." });
    }
    
    const currentAddresses = await prisma.address.findMany({
        where: { userId: req.user!.id }
    });

    let makeDefault = isDefault;
    if (currentAddresses.length === 0) makeDefault = true;

    if (makeDefault) {
        await prisma.address.updateMany({
            where: { userId: req.user!.id },
            data: { isDefault: false }
        });
    }

    await prisma.address.create({
        data: {
            userId: req.user!.id,
            label,
            address,
            city: city || "Local",
            state: state || "Local",
            zip: zip || "00000",
            isDefault: makeDefault,
            lat: Number(lat),
            lng: Number(lng)
        }
    });
    
    const addresses = await prisma.address.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "asc" }
    });
    
    res.status(201).json({ addresses });
}

// UPDATE ADDRESS
// PUT /api/addresses/:id
export const updateAddress = async (req: AuthRequest, res: Response) => {
    const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

    let makeDefault = isDefault;

    // REQUIRE COORDINATES
    if (lat == null || lng == null) {
        return res.status(400).json({ message: "Location coordinates are required. Please allow location access." });
    }
    
    if (makeDefault) {
        await prisma.address.updateMany({
            where: { userId: req.user!.id },
            data: { isDefault: false }
        });
    }

    const data: any = {};
    if (label) data.label = label;
    if (address) data.address = address;
    if (city) data.city = city;
    if (state) data.state = state;
    if (zip) data.zip = zip;
    if (isDefault != undefined) data.isDefault = isDefault;
    if (lat != null) data.lat = Number(lat);
    if (lng != null) data.lng = Number(lng);

    try {
        await prisma.address.update({
            where: { id: req.params.id as string },
            data,
        });
    } catch (err) {
        return res.status(404).json({ message: "Address not found" });
    }
    
    const addresses = await prisma.address.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "asc" }
    });
    
    res.json({ addresses });
}

// DELETE ADDRESS
// DELETE /api/addresses/:id
export const deleteAddress = async (req: AuthRequest, res: Response) => {
    try {
        await prisma.address.delete({ where: { id: req.params.id as string } });
    } catch (err: any) {
        console.log(err.message);
    }

    const addresses = await prisma.address.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "asc" }
    });
    
    res.json({ addresses });
}