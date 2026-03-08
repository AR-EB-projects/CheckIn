import { NextRequest, NextResponse } from 'next/server';

interface Question {
  id: string;
  question: string;
  targetMemberId?: string;
  isActive: boolean;
  createdAt: Date;
}

// Mock storage for questions
const questions: Question[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, targetMemberId } = body;

    // Validate input
    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Create new question
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: question.trim(),
      targetMemberId: targetMemberId || null,
      isActive: true,
      createdAt: new Date()
    };

    // Add to mock storage
    questions.push(newQuestion);

    return NextResponse.json(
      { 
        success: true,
        question: newQuestion 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
