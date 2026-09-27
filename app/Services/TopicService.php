<?php

namespace App\Services;

class TopicService
{
    /**
     * Curated topic catalog for matchmaking and speaking practice.
     */
    public const TOPICS = [
        'free_talk' => [
            'id' => 'free_talk',
            'category' => 'general',
            'category_key' => 'topics.cat_general',
            'title_key' => 'topics.free_talk_title',
            'default_title' => 'Free Talk & Casual Conversation',
            'prompt_key' => 'topics.free_talk_prompt',
            'default_prompt' => 'Speak freely about your day, personal interests, or any topic of mutual curiosity.',
            'bullets_keys' => [
                'topics.free_talk_b1',
                'topics.free_talk_b2',
                'topics.free_talk_b3',
            ],
            'default_bullets' => [
                'Break the ice with a warm introduction',
                'Ask open-ended follow-up questions',
                'Share a real personal story or opinion',
            ],
        ],
        'ielts_travel' => [
            'id' => 'ielts_travel',
            'category' => 'ielts_part2',
            'category_key' => 'topics.cat_ielts_part2',
            'title_key' => 'topics.travel_title',
            'default_title' => 'IELTS Part 2: A Memorable Journey',
            'prompt_key' => 'topics.travel_prompt',
            'default_prompt' => 'Describe a memorable trip you took. Explain where you went, why you went, and why it left such a strong impression.',
            'bullets_keys' => [
                'topics.travel_b1',
                'topics.travel_b2',
                'topics.travel_b3',
            ],
            'default_bullets' => [
                'Destination & mode of transportation',
                'Who accompanied you and what you explored',
                'Unforgettable highlights or unexpected surprises',
            ],
        ],
        'ielts_technology' => [
            'id' => 'ielts_technology',
            'category' => 'ielts_part3',
            'category_key' => 'topics.cat_ielts_part3',
            'title_key' => 'topics.tech_title',
            'default_title' => 'IELTS Part 3: AI & The Future of Work',
            'prompt_key' => 'topics.tech_prompt',
            'default_prompt' => 'How will artificial intelligence and automation change careers and human communication over the next decade?',
            'bullets_keys' => [
                'topics.tech_b1',
                'topics.tech_b2',
                'topics.tech_b3',
            ],
            'default_bullets' => [
                'Productivity gains vs. the loss of human touch',
                'Professions most impacted by intelligent tools',
                'Skills future students should cultivate today',
            ],
        ],
        'career_challenge' => [
            'id' => 'career_challenge',
            'category' => 'career',
            'category_key' => 'topics.cat_career',
            'title_key' => 'topics.career_title',
            'default_title' => 'Career & Overcoming Challenges',
            'prompt_key' => 'topics.career_prompt',
            'default_prompt' => 'Describe a difficult professional or academic problem you faced and the steps you took to resolve it.',
            'bullets_keys' => [
                'topics.career_b1',
                'topics.career_b2',
                'topics.career_b3',
            ],
            'default_bullets' => [
                'The initial obstacle and key stakeholders involved',
                'The concrete actions and strategy you executed',
                'The final outcome and long-term lesson learned',
            ],
        ],
        'hobbies_lifestyle' => [
            'id' => 'hobbies_lifestyle',
            'category' => 'general',
            'category_key' => 'topics.cat_general',
            'title_key' => 'topics.hobbies_title',
            'default_title' => 'Healthy Habits & Personal Passions',
            'prompt_key' => 'topics.hobbies_prompt',
            'default_prompt' => 'What hobby or daily routine has had the greatest positive impact on your physical or mental well-being?',
            'bullets_keys' => [
                'topics.hobbies_b1',
                'topics.hobbies_b2',
                'topics.hobbies_b3',
            ],
            'default_bullets' => [
                'When and why you started this activity',
                'How you stay consistent during busy periods',
                'Advice you would give someone wanting to try it',
            ],
        ],
    ];

    /**
     * Get all available topics as an array.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getAll(): array
    {
        return array_values(self::TOPICS);
    }

    /**
     * Find a topic by its key or return default free talk.
     *
     * @return array<string, mixed>
     */
    public static function find(?string $key): array
    {
        if ($key && isset(self::TOPICS[$key])) {
            return self::TOPICS[$key];
        }

        return self::TOPICS['free_talk'];
    }
}
