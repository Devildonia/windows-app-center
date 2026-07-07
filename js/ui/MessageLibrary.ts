import { Utils } from '../utils';
import { Services } from '../core/ServiceContainer';

export interface IMessageLibrary {
    get(category: string, avoidRepeat?: boolean): string;
    getByEmotion(emotion: string): string;
    getByState(state: string): string;
    getContextual(context: string): string;
    addToHistory(message: string): void;
    clearHistory(): void;
    getTotalMessageCount(): number;
    getCategories(): string[];
    isEmoji(text: string): boolean;
    getRecommendedFontSize(text: string): number;
}

class MessageLibrary implements IMessageLibrary {
    private messages: Record<string, string[]>;
    private recentMessages: string[];
    private maxHistory: number;

    constructor() {
        this.messages = {
            // ===== GREETINGS (5) =====
            GREETINGS: [
                'Hi!',
                'Hello!',
                'Hey!',
                '👋',
                'Yo!'
            ],

            // ===== HAPPINESS (6) =====
            HAPPY: [
                'Yay!',
                'Woohoo!',
                '😊',
                'Nice!',
                'Cool!',
                '⭐'
            ],

            // ===== SADNESS (5) =====
            SAD: [
                'Oww...',
                'Ouch!',
                '😢',
                'Noo...',
                '💔'
            ],

            // ===== ANGER (5) =====
            ANGRY: [
                'Grr!',
                '😠',
                'Hmph!',
                'Stop!',
                '💢'
            ],

            // ===== FEAR (5) =====
            SCARED: [
                'Eek!',
                '😱',
                'Help!',
                'Ahh!',
                '!!!'
            ],

            // ===== SURPRISE (5) =====
            SURPRISED: [
                'Oh!',
                'Wow!',
                '😮',
                'What?!',
                '⁉️'
            ],

            // ===== TIREDNESS (5) =====
            TIRED: [
                'Zzz...',
                '😴',
                '*yawn*',
                'Sleepy...',
                '💤'
            ],

            // ===== THINKING (5) =====
            THINKING: [
                'Hmm...',
                '🤔',
                '...',
                '💭',
                'What if...'
            ],

            // ===== CONFUSION (4) =====
            CONFUSED: [
                'Huh?',
                '❓',
                '???',
                'What?'
            ],

            // ===== EATING (5) =====
            EATING: [
                'Yum!',
                '😋',
                'Nom nom',
                '🍕',
                'Tasty!'
            ],

            // ===== DRINKING (4) =====
            DRINKING: [
                'Gulp!',
                '🥤',
                '*sip*',
                'Ahhh!'
            ],

            // ===== EXERCISE (4) =====
            EXERCISING: [
                'Hup!',
                '💪',
                'One!',
                'Two!'
            ],

            // ===== CELEBRATION (5) =====
            CELEBRATING: [
                'Yeah!',
                '🎉',
                'Wooo!',
                'Yess!',
                '✨'
            ],

            // ===== BOREDOM (4) =====
            BORED: [
                'Sigh...',
                '😑',
                'Meh...',
                'So bored'
            ],

            // ===== LOVE (5) =====
            LOVE: [
                '❤️',
                '😍',
                'Aww!',
                '💕',
                'Love it!'
            ],

            // ===== PAIN (5) =====
            HURT: [
                'Ow!',
                '💥',
                'That hurt!',
                'Ouch!',
                '😣'
            ],

            // ===== JUMPING (3) =====
            JUMPING: [
                'Whee!',
                '!',
                'Boing!'
            ],

            // ===== WATCHING (3) =====
            WATCHING: [
                '👀',
                '...',
                'Hmm?'
            ],

            // ===== STYLE/COOL (5) =====
            COOL: [
                'Cool!',
                '😎',
                'So cool!',
                'Stylin\'',
                '✨'
            ],

            // ===== HUNGRY (5) =====
            HUNGRY: [
                'Hungry...',
                '😋',
                'Need food',
                'Pizza?',
                '🍔'
            ],

            // ===== FUNNY (5) =====
            FUNNY: [
                'Haha!',
                '😂',
                'LOL',
                'Funny!',
                '🤣'
            ]
        };

        // Recent message history (avoid repetitions)
        this.recentMessages = [];
        this.maxHistory = 5;

        Utils.Logger.audio(`MessageLibrary initialized with ${this.getTotalMessageCount()} messages`);
    }

    /**
     * Get a random message from a category
     * @param {string} category - Message category
     * @param {boolean} avoidRepeat - Avoid repeating recent messages
     * @returns {string} Selected message
     */
    get(category: string, avoidRepeat: boolean = true): string {
        const messages = this.messages[category];

        if (!messages || messages.length === 0) {
            Utils.Logger.warn(`Category "${category}" not found in MessageLibrary`);
            return '...';
        }

        if (avoidRepeat && messages.length > 1) {
            // Filter recent messages
            const available = messages.filter(msg => !this.recentMessages.includes(msg));

            if (available.length > 0) {
                const message = available[Math.floor(Math.random() * available.length)];
                if (message) {
                    this.addToHistory(message);
                    return message;
                }
            }
        }

        // If none available or not avoiding repetition, pick random
        const message = messages[Math.floor(Math.random() * messages.length)] || '';
        this.addToHistory(message);
        return message;
    }

    /**
     * Get message based on emotion
     * @param {string} emotion - Current emotion (happy, sad, angry, etc.)
     * @returns {string} Appropriate message
     */
    getByEmotion(emotion: string): string {
        const emotionMap: Record<string, string> = {
            'happy': 'HAPPY',
            'sad': 'SAD',
            'angry': 'ANGRY',
            'panic': 'SCARED',
            'surprised': 'SURPRISED',
            'neutral': 'THINKING',
            'tired': 'TIRED',
            'hurt': 'HURT'
        };

        const category = emotionMap[emotion] || 'THINKING';
        return this.get(category);
    }

    /**
     * Get message based on state
     * @param {string} state - Current state (idle, walking, jumping, etc.)
     * @returns {string} Appropriate message
     */
    getByState(state: string): string {
        const stateMap: Record<string, string> = {
            'idle': 'THINKING',
            'walking': 'HAPPY',
            'scared': 'SCARED',
            'waving': 'GREETINGS',
            'sitting': 'TIRED',
            'jumping': 'JUMPING',
            'dancing': 'CELEBRATING',
            'hurt': 'HURT',
            'looking-up': 'WATCHING'
        };

        const category = stateMap[state] || 'THINKING';
        return this.get(category);
    }

    /**
     * Get contextual message based on situation
     * @param {string} context - Context (grabbed, dropped, near, etc.)
     * @returns {string} Appropriate message
     */
    getContextual(context: string): string {
        switch (context) {
            case 'grabbed':
                return this.get('SURPRISED');
            case 'dropped':
                return this.get('SCARED');
            case 'near':
                return this.get('WATCHING');
            case 'firstMeet':
                return this.get('GREETINGS');
            case 'happy':
                return this.get('HAPPY');
            case 'love':
                return this.get('LOVE');
            default:
                return this.get('THINKING');
        }
    }

    /**
     * Add message to history
     */
    addToHistory(message: string): void {
        this.recentMessages.push(message);
        if (this.recentMessages.length > this.maxHistory) {
            this.recentMessages.shift();
        }
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.recentMessages = [];
    }

    /**
     * Get total message count
     */
    getTotalMessageCount(): number {
        return Object.values(this.messages).reduce((sum, arr) => sum + arr.length, 0);
    }

    /**
     * Get all categories
     */
    getCategories(): string[] {
        return Object.keys(this.messages);
    }

    /**
     * Check if text is emoji
     * @param {string} text - Text to verify
     * @returns {boolean} True if it is primarily emoji
     */
    isEmoji(text: string): boolean {
        const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u;
        return emojiRegex.test(text.trim());
    }

    /**
     * Get recommended font size for text
     * @param {string} text - Text to evaluate
     * @returns {number} Font size in px
     */
    getRecommendedFontSize(text: string): number {
        if (this.isEmoji(text)) {
            return 20; // Larger emojis
        }

        if (text.length <= 3) {
            return 16; // Very short texts
        }

        if (text.length <= 8) {
            return 12; // Short texts
        }

        return 11; // Normal texts
    }
}

// Export for use in modules
export { MessageLibrary };

if (typeof window !== 'undefined') {
    Services.register('MessageLibrary', MessageLibrary);
}