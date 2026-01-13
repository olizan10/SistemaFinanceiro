'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    image?: string; // Base64 da imagem
}

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Ol á! 👋 Sou seu assistente financeiro com IA. Posso te ajudar a:\n\n• Adicionar transações e contas\n• Analisar sua saúde financeira\n• Processar comprovantes por foto\n• Dar dicas para economizar\n\nComo posso ajudar?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length > 0) {
            const file = imageFiles[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setSelectedImage(base64);
                setImagePreview(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    // Copiar mensagem
    const copyMessage = (text: string) => {
        navigator.clipboard.writeText(text);
        // Feedback visual opcional
    };

    // Áudio
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                // Converter áudio para base64
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Audio = reader.result as string;

                    if (selectedImage) {
                        // Enviar imagem + legenda de áudio
                        await handleSendWithImageAndAudio(selectedImage, base64Audio);
                    } else {
                        // Enviar só áudio
                        await handleSendAudio(base64Audio);
                    }
                };
                reader.readAsDataURL(audioBlob);

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Erro ao acessar microfone:', error);
            alert('Erro ao acessar microfone. Permita o acesso ao microfone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSendAudio = async (audioBase64: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Aqui você implementaria a rota no backend para transcrever áudio
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/audio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ audio: audioBase64 })
            });

            const data = await response.json();

            if (response.ok) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Erro ao enviar áudio:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendWithImageAndAudio = async (imageBase64: string, audioBase64: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/process-receipt-audio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    image: imageBase64,
                    audio: audioBase64
                })
            });

            const data = await response.json();

            if (response.ok) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                setSelectedImage(null);
                setImagePreview(null);
                setCaption('');
            }
        } catch (error) {
            console.error('Erro ao processar:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        // Se tem imagem selecionada
        if (selectedImage) {
            await handleSendWithImage();
            return;
        }

        // Envio de texto normal
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: input })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao processar mensagem');
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (data.action) {
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error: any) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `Desculpe, ocorreu um erro: ${error.message}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendWithImage = async () => {
        if (!selectedImage) return;

        setLoading(true);

        try {
            const userMessage: Message = {
                role: 'user',
                content: caption || '📸 Comprovante enviado',
                timestamp: new Date(),
                image: selectedImage
            };
            setMessages(prev => [...prev, userMessage]);

            const token = localStorage.getItem('token');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/process-receipt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    image: selectedImage,
                    caption: caption
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao processar comprovante');
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: `✅ Comprovante processado com sucesso!\n\n📄 **Dados extraídos:**\n• Valor: R$ ${data.data.amount}\n• Data: ${new Date(data.data.date).toLocaleDateString('pt-BR')}\n• Estabelecimento: ${data.data.merchant}\n• Categoria: ${data.data.category}\n\nTransação adicionada automaticamente!`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Limpar
            setSelectedImage(null);
            setImagePreview(null);
            setCaption('');
            setInput('');

            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `Erro ao processar comprovante: ${error.message}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setSelectedImage(base64);
            setImagePreview(base64);
        };
        reader.readAsDataURL(file);
    };

    const cancelImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setCaption('');
        setInput('');
    };

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center text-3xl"
                aria-label="Assistente de IA"
            >
                🤖
            </button>

            {/* Janela do chat */}
            {isOpen && (
                <div
                    className={`fixed bottom-28 right-4 md:right-8 z-50 w-[calc(100vw-2rem)] md:w-[400px] max-w-[400px] h-[600px] max-h-[80vh] glass rounded-3xl shadow-2xl flex flex-col fade-in-up border border-gray-300 dark:border-gray-700 ${isDragging ? 'ring-4 ring-purple-500' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-3xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🤖</span>
                            <div>
                                <h3 className="font-bold text-white">Assistente IA</h3>
                                <p className="text-xs text-purple-100">Powered by Gemini</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Drag & Drop overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 bg-purple-500/20 rounded-3xl flex items-center justify-center z-10 backdrop-blur">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📸</div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">Solte a imagem aqui</p>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-transparent">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100'
                                        }`}
                                >
                                    {msg.image && (
                                        <img src={msg.image} alt="Anexo" className="rounded-lg mb-2 max-w-full" />
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className={`text-xs ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {msg.role === 'assistant' && (
                                            <button
                                                onClick={() => copyMessage(msg.content)}
                                                className="ml-2 text-xs hover:text-purple-600 dark:hover:text-purple-400"
                                                title="Copiar"
                                            >
                                                📋
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-3 rounded-2xl">
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Preview de imagem selecionada */}
                    {imagePreview && (
                        <div className="p-4 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                            <div className="relative">
                                <img src={imagePreview} alt="Preview" className="rounded-lg max-h-32 mx-auto" />
                                <button
                                    onClick={cancelImage}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                    ✕
                                </button>
                            </div>
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Adicionar legenda... (opcional)"
                                className="w-full mt-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                        />

                        <div className="flex gap-2 items-center">
                            {/* Botões de ação */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className="p-2 text-xl text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                                title="Enviar foto"
                            >
                                📷
                            </button>
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={loading}
                                className={`p-2 text-xl ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-400'} hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50`}
                                title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                            >
                                {isRecording ? '⏹️' : '🎤'}
                            </button>

                            {/* Input de texto */}
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={selectedImage ? "Legenda da foto..." : "Digite sua mensagem..."}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                            />

                            {/* Botão enviar */}
                            <button
                                onClick={handleSend}
                                disabled={loading || (!input.trim() && !selectedImage)}
                                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
