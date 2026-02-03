/**
 * QuizStep - Step 2 of Roommate Setup Wizard
 * Lifestyle compatibility quiz
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    ArrowLeft,
    ArrowRight,
    Moon,
    Users,
    Music,
    Coffee,
    Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { QuizAnswer } from '@/services/roommates';

interface QuizStepProps {
    onNext: (answers: QuizAnswer[]) => void;
    onBack: () => void;
    initialAnswers?: QuizAnswer[];
}

// Quiz questions with icons
const questions = [
    {
        id: 1,
        question: 'Lịch ngủ lý tưởng của bạn?',
        icon: Moon,
        options: [
            { label: 'Ngủ sớm (trước 10 giờ tối)', value: 'early' },
            { label: 'Ngủ muộn (sau nửa đêm)', value: 'late' },
            { label: 'Linh hoạt', value: 'flexible' },
        ],
    },
    {
        id: 2,
        question: 'Bạn có khách đến thăm thường xuyên không?',
        icon: Users,
        options: [
            { label: 'Hiếm khi', value: 'rarely' },
            { label: 'Thỉnh thoảng', value: 'sometimes' },
            { label: 'Thường xuyên', value: 'frequently' },
        ],
    },
    {
        id: 3,
        question: 'Bạn thích môi trường như thế nào?',
        icon: Music,
        options: [
            { label: 'Yên tĩnh', value: 'quiet' },
            { label: 'Ồn vừa phải được', value: 'moderate' },
            { label: 'Không ngại ồn', value: 'noisy' },
        ],
    },
    {
        id: 4,
        question: 'Bạn thường làm gì vào cuối tuần?',
        icon: Coffee,
        options: [
            { label: 'Thư giãn tại nhà', value: 'home' },
            { label: 'Đi chơi bên ngoài', value: 'out' },
            { label: 'Kết hợp cả hai', value: 'mix' },
        ],
    },
    {
        id: 5,
        question: 'Phong cách sống của bạn?',
        icon: Sparkles,
        options: [
            { label: 'Rất ngăn nắp', value: 'organized' },
            { label: 'Vừa phải', value: 'moderate' },
            { label: 'Thoải mái', value: 'relaxed' },
        ],
    },
];

export function QuizStep({ onNext, onBack, initialAnswers = [] }: QuizStepProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>(() => {
        // Initialize from initial answers
        const initial: Record<number, string> = {};
        initialAnswers.forEach(a => {
            initial[a.question_id] = a.answer_value;
        });
        return initial;
    });

    const question = questions[currentQuestion];
    const Icon = question.icon;
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    const handleSelectOption = (value: string) => {
        setAnswers(prev => ({
            ...prev,
            [question.id]: value,
        }));

        // Auto-advance to next question after a short delay
        setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            }
        }, 300);
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        } else {
            onBack();
        }
    };

    const handleSubmit = () => {
        const quizAnswers: QuizAnswer[] = Object.entries(answers).map(([qId, value]) => ({
            question_id: parseInt(qId),
            answer_value: value,
        }));
        onNext(quizAnswers);
    };

    const isLastQuestion = currentQuestion === questions.length - 1;
    const hasAnsweredCurrent = answers[question.id] !== undefined;
    const hasAnsweredAll = Object.keys(answers).length === questions.length;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto px-4 py-8"
        >
            {/* Header */}
            <div className="mb-8">
                <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {currentQuestion > 0 ? 'Câu trước' : 'Quay lại'}
                </Button>
            </div>

            {/* Progress */}
            <div className="mb-8">
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                    Câu hỏi {currentQuestion + 1} / {questions.length}
                </p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                    ✓
                </div>
                <div className="w-16 h-1 bg-primary rounded" />
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                    2
                </div>
                <div className="w-16 h-1 bg-muted rounded" />
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                    3
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    <Card className="p-8 rounded-3xl shadow-lg border-0">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Icon className="w-8 h-8 text-primary" />
                        </div>

                        <h2 className="text-xl font-semibold text-center mb-8">
                            {question.question}
                        </h2>

                        <div className="space-y-3">
                            {question.options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelectOption(option.value)}
                                    className={cn(
                                        'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                                        'hover:border-primary hover:bg-primary/5',
                                        answers[question.id] === option.value
                                            ? 'border-primary bg-primary/10 text-primary font-medium'
                                            : 'border-muted bg-background'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                                answers[question.id] === option.value
                                                    ? 'border-primary bg-primary'
                                                    : 'border-muted-foreground'
                                            )}
                                        >
                                            {answers[question.id] === option.value && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <span>{option.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    className="w-32"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {currentQuestion > 0 ? 'Trước' : 'Quay lại'}
                </Button>

                {isLastQuestion ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={!hasAnsweredAll}
                        className="w-32"
                    >
                        Tiếp tục
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={() => setCurrentQuestion(currentQuestion + 1)}
                        disabled={!hasAnsweredCurrent}
                        className="w-32"
                    >
                        Tiếp
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
