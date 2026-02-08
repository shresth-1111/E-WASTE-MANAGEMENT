"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

interface AuthContextType {
    user: User | null
    loading: boolean
    signOut: () => Promise<void>
    userProfile: any
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
    userProfile: null
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [userProfile, setUserProfile] = useState<any>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user)
            if (user) {
                // Fetch or create user profile
                const userRef = doc(db, "users", user.uid)
                const userSnap = await getDoc(userRef)

                if (userSnap.exists()) {
                    setUserProfile(userSnap.data())
                } else {
                    // Create new profile
                    const newProfile = {
                        name: user.displayName || "User",
                        email: user.email,
                        totalStars: 0,
                        testsCompleted: 0,
                        createdAt: new Date()
                    }
                    await setDoc(userRef, newProfile)
                    setUserProfile(newProfile)
                }
            } else {
                setUserProfile(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const signOut = async () => {
        await firebaseSignOut(auth)
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut, userProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
