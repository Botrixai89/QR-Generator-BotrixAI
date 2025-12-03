import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const isTestMode = process.env.E2E_TEST_MODE === 'true'

    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )

    let body: { name?: string; email?: string; password?: string } | null = null
    try {
      const jsonPromise = request.json()
      body = await Promise.race([jsonPromise, timeoutPromise]) as { name?: string; email?: string; password?: string }
    } catch (error) {
      if (!isTestMode) {
        throw error
      }
    }

    const name = body?.name
    const email = body?.email
    const password = body?.password

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (isTestMode) {
      return NextResponse.json(
        { message: "User created successfully (test mode)", userId: `test-${email}` },
        { status: 201 }
      )
    }

    // Check if user already exists
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      )
    }

    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking existing user:", checkError)
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const userId = randomUUID()
    const now = new Date().toISOString()
    const { data: user, error: createError } = await supabaseAdmin!
      .from('User')
      .insert({
        id: userId,
        name,
        email,
        password: hashedPassword,
        credits: 0, // Free users don't have credits - they have feature restrictions
        plan: 'FREE', // Set default plan to FREE
        createdAt: now,
        updatedAt: now,
      })
      .select('id')
      .single()

    if (createError) {
      console.error("Error creating user:", createError)
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      )
    }

    // Send email verification email
    try {
      const { sendEmailVerification } = await import('@/lib/transactional-emails')
      await sendEmailVerification(user.id, email, name)
    } catch (error) {
      // Don't fail registration if email fails
      console.error('Failed to send verification email:', error)
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
