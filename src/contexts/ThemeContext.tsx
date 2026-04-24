/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppTheme, AppLanguage, I18nDictionary, VoiceGender } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  translationLanguage: AppLanguage;
  setTranslationLanguage: (lang: AppLanguage) => void;
  voiceGender: VoiceGender;
  setVoiceGender: (gender: VoiceGender) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  eyeProtectionIntensity: number;
  setEyeProtectionIntensity: (intensity: number) => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const dictionary: I18nDictionary = {
  'app.title': {
    PT: 'Kidreamers',
    EN: 'Kidreamers',
    ES: 'Kidreamers',
    FR: 'Kidreamers',
    DE: 'Kidreamers',
    RU: 'Kidreamers'
  },
  'header.signedIn': {
    PT: 'Logado como',
    EN: 'Signed in as',
    ES: 'Conectado como',
    FR: 'Connecté en tant que',
    DE: 'Angemeldet als',
    RU: 'Вошел как'
  },
  'header.language': {
    PT: 'Idioma',
    EN: 'Language',
    ES: 'Idioma',
    FR: 'Langue',
    DE: 'Sprache',
    RU: 'Язык'
  },
  'header.myDeck': {
    PT: 'Meu Baralho',
    EN: 'My Deck',
    ES: 'Mi Mazo',
    FR: 'Mon Pont',
    DE: 'Mein Stapel',
    RU: 'Моя колода'
  },
  'header.signOut': {
    PT: 'Sair',
    EN: 'Sign Out',
    ES: 'Cerrar Sesión',
    FR: 'Se Déconnecter',
    DE: 'Abmelden',
    RU: 'Выйти'
  },
  'nav.home': {
    PT: 'Início',
    EN: 'Home',
    ES: 'Inicio',
    FR: 'Accueil',
    DE: 'Startseite',
    RU: 'Главная'
  },
  'nav.deck': {
    PT: 'Baralho',
    EN: 'Deck',
    ES: 'Mazo',
    FR: 'Pont',
    DE: 'Stapel',
    RU: 'Колода'
  },
  'nav.submit': {
    PT: 'Enviar',
    EN: 'Submit',
    ES: 'Enviar',
    FR: 'Envoyer',
    DE: 'Senden',
    RU: 'Отправить'
  },
  'nav.profile': {
    PT: 'Perfil',
    EN: 'Profile',
    ES: 'Perfil',
    FR: 'Profil',
    DE: 'Profil',
    RU: 'Профиль'
  },
  'search.placeholder': {
    PT: 'Buscar histórias...',
    EN: 'Search stories...',
    ES: 'Buscar historias...',
    FR: 'Rechercher des histoires...',
    DE: 'Geschichten suchen...',
    RU: 'Поиск историй...'
  },
  'filter.level': {
    PT: 'Nível',
    EN: 'Level',
    ES: 'Nivel',
    FR: 'Niveau',
    DE: 'Niveau',
    RU: 'Уровень'
  },
  'filter.sort': {
    PT: 'Ordenar por',
    EN: 'Sort By',
    ES: 'Ordenar por',
    FR: 'Trier par',
    DE: 'Sortieren nach',
    RU: 'Сортировать по'
  },
  'filter.recent': {
    PT: 'Mais Recentes',
    EN: 'Most Recent',
    ES: 'Más Recientes',
    FR: 'Plus Récents',
    DE: 'Neueste',
    RU: 'Последние'
  },
  'filter.difficulty': {
    PT: 'Por Dificuldade',
    EN: 'By Difficulty',
    ES: 'Por Dificultad',
    FR: 'Par Difficulté',
    DE: 'Nach Schwierigkeit',
    RU: 'По сложности'
  },
  'filter.popular': {
    PT: 'Mais Acessados',
    EN: 'Most Popular',
    ES: 'Más Populares',
    FR: 'Plus Populaires',
    DE: 'Beliebteste',
    RU: 'Популярные'
  },
  'filter.all': {
    PT: 'Todos',
    EN: 'All',
    ES: 'Todos',
    FR: 'Tous',
    DE: 'Alle',
    RU: 'Все'
  },
  'home.noStories': {
    PT: 'Nenhuma história encontrada',
    EN: 'No stories found',
    ES: 'No se encontraron historias',
    FR: 'Aucune histoire trouvée',
    DE: 'Keine Geschichten gefunden',
    RU: 'Истории не найдены'
  },
  'home.noStoriesDesc': {
    PT: 'Tente ajustar seus filtros ou buscar por outro termo.',
    EN: 'Try adjusting your filters or searching for another term.',
    ES: 'Intenta ajustar tus filtros o buscar outro término.',
    FR: 'Essayez d\'ajuster vos filtres ou de rechercher um autre terme.',
    DE: 'Versuchen Sie, Ihre Filter anzupassen oder nach einem anderen Begriff zu suchen.',
    RU: 'Попробуйте изменить фильтры или поискать другой термин.'
  },
  'reader.translating': {
    PT: 'Traduzindo...',
    EN: 'Translating...',
    ES: 'Traduciendo...',
    FR: 'Traduction...',
    DE: 'Übersetzen...',
    RU: 'Перевод...'
  },
  'reader.original': {
    PT: 'Original',
    EN: 'Original',
    ES: 'Original',
    FR: 'Original',
    DE: 'Original',
    RU: 'Оригинал'
  },
  'filter.genre': {
    PT: 'Categoria',
    EN: 'Category',
    ES: 'Categoría',
    FR: 'Catégorie',
    DE: 'Kategorie',
    RU: 'Категория'
  },
  'category.contos': {
    PT: 'Contos',
    EN: 'Short Stories',
    ES: 'Cuentos',
    FR: 'Contes',
    DE: 'Kurzgeschichten',
    RU: 'Рассказы'
  },
  'category.infantil': {
    PT: 'Infantil',
    EN: 'Children',
    ES: 'Infantil',
    FR: 'Enfants',
    DE: 'Kinder',
    RU: 'Детские'
  },
  'category.news': {
    PT: 'NEWS',
    EN: 'NEWS',
    ES: 'NOTICIAS',
    FR: 'NOUVELLES',
    DE: 'NACHRICHTEN',
    RU: 'НОВОСТИ'
  },
  'news.politica.nacional': {
    PT: 'Política Nacional',
    EN: 'National Politics',
    ES: 'Política Nacional',
    FR: 'Politique Nationale',
    DE: 'Nationale Politik',
    RU: 'Национальная политика'
  },
  'news.politica.global': {
    PT: 'Política Global',
    EN: 'Global Politics',
    ES: 'Política Global',
    FR: 'Politique Mondiale',
    DE: 'Globale Politik',
    RU: 'Глобальная политика'
  },
  'news.economia.nacional': {
    PT: 'Economia Nacional',
    EN: 'National Economy',
    ES: 'Economía Nacional',
    FR: 'Économie Nationale',
    DE: 'Nationale Wirtschaft',
    RU: 'Национальная экономика'
  },
  'news.economia.global': {
    PT: 'Economia Global',
    EN: 'Global Economy',
    ES: 'Economía Global',
    FR: 'Économie Mondiale',
    DE: 'Globale Wirtschaft',
    RU: 'Глобальная экономика'
  },
  'news.quentes': {
    PT: 'Notícias Quentes',
    EN: 'Hot News',
    ES: 'Noticias Calientes',
    FR: 'Nouvelles Chaudes',
    DE: 'Heiße Nachrichten',
    RU: 'Горячие новости'
  },
  'news.trends': {
    PT: 'Trend Topics X',
    EN: 'Trend Topics X',
    ES: 'Trend Topics X',
    FR: 'Trend Topics X',
    DE: 'Trend Topics X',
    RU: 'Тренды X'
  },
  'theme.light': {
    PT: 'Claro',
    EN: 'Light',
    ES: 'Claro',
    FR: 'Clair',
    DE: 'Hell',
    RU: 'Светлая'
  },
  'theme.dark': {
    PT: 'Escuro',
    EN: 'Dark',
    ES: 'Oscuro',
    FR: 'Sombre',
    DE: 'Dunkel',
    RU: 'Темная'
  },
  'theme.eyeProtection': {
    PT: 'Proteção Ocular',
    EN: 'Eye Protection',
    ES: 'Protección Ocular',
    FR: 'Protection Oculaire',
    DE: 'Augenschutz',
    RU: 'Защита глаз'
  },
  'reader.translate': {
    PT: 'Traduzir',
    EN: 'Translate',
    ES: 'Traducir',
    FR: 'Traduire',
    DE: 'Übersetzen',
    RU: 'Перевести'
  },
  'reader.save': {
    PT: 'Salvar no Baralho',
    EN: 'Save to Deck',
    ES: 'Guardar en el Mazo',
    FR: 'Enregistrer dans le Pont',
    DE: 'Im Stapel speichern',
    RU: 'Сохранить в колоду'
  },
  'deck.empty': {
    PT: 'Seu baralho está vazio.',
    EN: 'Your deck is empty.',
    ES: 'Tu mazo está vacío.',
    FR: 'Votre pont est vide.',
    DE: 'Dein Stapel ist leer.',
    RU: 'Ваша колода пуста.'
  },
  'deck.emptyDesc': {
    PT: 'Que tal ler uma nova história e salvar algumas palavras para começar sua jornada?',
    EN: 'How about reading a new story and saving some words to start your journey?',
    ES: '¿Qué tal leer una nueva historia y guardar algunas palabras para comenzar tu viaje?',
    FR: 'Que diriez-vous de lire une nouvelle histoire et d\'enregistrer quelques mots pour commencer votre voyage ?',
    DE: 'Wie wäre es, eine neue Geschichte zu lesen und einige Wörter zu speichern, um deine Reise zu beginnen?',
    RU: 'Как насчет того, чтобы прочитать новую историю и сохранить несколько слов для начала вашего путешествия?'
  },
  'deck.total': {
    PT: 'Total de Cards',
    EN: 'Total Cards',
    ES: 'Total de Tarjetas',
    FR: 'Total des Cartes',
    DE: 'Gesamtkarten',
    RU: 'Всего карточек'
  },
  'deck.due': {
    PT: 'Para Revisar',
    EN: 'Due for Review',
    ES: 'Pendientes de Revisión',
    FR: 'À Réviser',
    DE: 'Zur Überprüfung fällig',
    RU: 'К повторению'
  },
  'deck.start': {
    PT: 'Começar',
    EN: 'Start',
    ES: 'Comenzar',
    FR: 'Commencer',
    DE: 'Start',
    RU: 'Начать'
  },
  'deck.allWords': {
    PT: 'Todas as Palavras',
    EN: 'All Words',
    ES: 'Todas las Palabras',
    FR: 'Tous les Mots',
    DE: 'Alle Wörter',
    RU: 'Все слова'
  },
  'deck.explore': {
    PT: 'Explorar Histórias',
    EN: 'Explore Stories',
    ES: 'Explorar Historias',
    FR: 'Explorer des Histoires',
    DE: 'Geschichten erkunden',
    RU: 'Исследовать истории'
  },
  'deck.congrats': {
    PT: 'Parabéns! Você está em dia!',
    EN: 'Congratulations! You\'re up to date!',
    ES: '¡Felicidades! ¡Estás al día!',
    FR: 'Félicitations ! Vous êtes à jour !',
    DE: 'Herzlichen Glückwunsch! Du bist auf dem Laufenden!',
    RU: 'Поздравляем! Вы все повторили!'
  },
  'deck.congratsDesc': {
    PT: 'Ótimo trabalho! Volte amanhã para mais revisões e continue evoluindo.',
    EN: 'Great work! Come back tomorrow for more reviews and keep evolving.',
    ES: '¡Buen trabalho! Vuelve mañana para más revisiones e continua evoluindo.',
    FR: 'Bon travail ! Revenez demain pour plus de révisions et continuez à évoluer.',
    DE: 'Gute Arbeit! Komm morgen wieder für weitere Überprüfungen und entwickle dich weiter.',
    RU: 'Отличная работа! Возвращайтесь завтра для новых повторений и продолжайте развиваться.'
  },
  'deck.reviewing': {
    PT: 'Revisando',
    EN: 'Reviewing',
    ES: 'Revisando',
    FR: 'Révision',
    DE: 'Überprüfung',
    RU: 'Повторение'
  },
  'deck.word': {
    PT: 'Palavra',
    EN: 'Word',
    ES: 'Palabra',
    FR: 'Mot',
    DE: 'Wort',
    RU: 'Слово'
  },
  'deck.translation': {
    PT: 'Tradução',
    EN: 'Translation',
    ES: 'Traducción',
    FR: 'Traduction',
    DE: 'Übersetzung',
    RU: 'Перевод'
  },
  'deck.context': {
    PT: 'Contexto',
    EN: 'Context',
    ES: 'Contexto',
    FR: 'Contexte',
    DE: 'Kontext',
    RU: 'Контекст'
  },
  'deck.flip': {
    PT: 'Clique para virar',
    EN: 'Click to flip',
    ES: 'Haz clic para girar',
    FR: 'Cliquez para retourner',
    DE: 'Klicken zum Umdrehen',
    RU: 'Нажмите, чтобы перевернуть'
  },
  'deck.again': {
    PT: 'De novo',
    EN: 'Again',
    ES: 'De nuevo',
    FR: 'Encore',
    DE: 'Nochmal',
    RU: 'Снова'
  },
  'deck.good': {
    PT: 'Bom',
    EN: 'Good',
    ES: 'Bueno',
    FR: 'Bon',
    DE: 'Gut',
    RU: 'Хорошо'
  },
  'deck.easy': {
    PT: 'Fácil',
    EN: 'Easy',
    ES: 'Fácil',
    FR: 'Facile',
    DE: 'Einfach',
    RU: 'Легко'
  },
  'submit.title': {
    PT: 'Criar História',
    EN: 'Create Story',
    ES: 'Crear Historia',
    FR: 'Créer une Histoire',
    DE: 'Geschichte erstellen',
    RU: 'Создать историю'
  },
  'submit.content': {
    PT: 'Conteúdo',
    EN: 'Content',
    ES: 'Contenido',
    FR: 'Contenu',
    DE: 'Inhalt',
    RU: 'Содержание'
  },
  'submit.publish': {
    PT: 'Publicar com IA',
    EN: 'Publish with AI',
    ES: 'Publicar con IA',
    FR: 'Publier avec l\'IA',
    DE: 'Mit KI veröffentlichen',
    RU: 'Опубликовать с помощью ИИ'
  },
  'submit.analyzing': {
    PT: 'Analisando nível...',
    EN: 'Analyzing level...',
    ES: 'Analizando nivel...',
    FR: 'Analyse du niveau...',
    DE: 'Niveau analysieren...',
    RU: 'Анализ уровня...'
  },
  'submit.generating': {
    PT: 'Gerando variantes...',
    EN: 'Generating variants...',
    ES: 'Generando variantes...',
    FR: 'Génération de variantes...',
    DE: 'Varianten generieren...',
    RU: 'Генерация вариантов...'
  },
  'submit.creating': {
    PT: 'Criando arte de capa...',
    EN: 'Creating cover art...',
    ES: 'Creando arte de portada...',
    FR: 'Création de l\'illustration...',
    DE: 'Cover-Art erstellen...',
    RU: 'Создание обложки...'
  },
  'submit.success': {
    PT: 'História publicada com sucesso!',
    EN: 'Story published successfully!',
    ES: '¡Historia publicada con éxito!',
    FR: 'Histoire publiée avec succès !',
    DE: 'Geschichte erfolgreich veröffentlicht!',
    RU: 'История успешно опубликована!'
  },
  'deck.review': {
    PT: 'Revisar Agora',
    EN: 'Review Now',
    ES: 'Revisar Ahora',
    FR: 'Réviser Maintenant',
    DE: 'Jetzt überprüfen',
    RU: 'Повторить сейчас'
  },
  'profile.appLanguage': {
    PT: 'Idioma do Aplicativo',
    EN: 'App Language',
    ES: 'Idioma de la Aplicación',
    FR: 'Langue de l\'Application',
    DE: 'App-Sprache',
    RU: 'Язык приложения'
  },
  'profile.translationLanguage': {
    PT: 'Idioma de Tradução Padrão',
    EN: 'Default Translation Language',
    ES: 'Idioma de Traducción Predeterminado',
    FR: 'Langue de Traduction par Défaut',
    DE: 'Standard-Übersetzungssprache',
    RU: 'Язык перевода по умолчанию'
  },
  'profile.preferences': {
    PT: 'Preferências',
    EN: 'Preferences',
    ES: 'Preferencias',
    FR: 'Préférences',
    DE: 'Präferenzen',
    RU: 'Настройки'
  },
  'profile.englishLevel': {
    PT: 'Nível de Inglês',
    EN: 'English Level',
    ES: 'Nivel de Inglés',
    FR: 'Niveau d\'Anglais',
    DE: 'Englisch-Niveau',
    RU: 'Уровень английского'
  },
  'profile.myDeck': {
    PT: 'Meu Baralho',
    EN: 'My Deck',
    ES: 'Mi Mazo',
    FR: 'Mon Pont',
    DE: 'Mein Stapel',
    RU: 'Моя колода'
  },
  'profile.myQuotes': {
    PT: 'Minhas Citações',
    EN: 'My Quotes',
    ES: 'Mis Citas',
    FR: 'Mes Citations',
    DE: 'Meine Zitate',
    RU: 'Мои цитаты'
  },
  'reader.saveQuote': {
    PT: 'Salvar Citação',
    EN: 'Save Quote',
    ES: 'Guardar Cita',
    FR: 'Enregistrer la Citation',
    DE: 'Zitat speichern',
    RU: 'Сохранить цитату'
  },
  'reader.addReview': {
    PT: 'Revisão',
    EN: 'Review',
    ES: 'Revisión',
    FR: 'Révision',
    DE: 'Überprüfung',
    RU: 'Повторение'
  },
  'profile.voiceGender': {
    PT: 'Gênero da Voz (Leitura)',
    EN: 'Voice Gender (Reading)',
    ES: 'Género de la Voz (Lectura)',
    FR: 'Genre de la Voix (Lecture)',
    DE: 'Stimmgeschlecht (Lesen)',
    RU: 'Пол голоса (чтение)'
  },
  'voice.male': {
    PT: 'Masculino',
    EN: 'Male',
    ES: 'Masculino',
    FR: 'Masculin',
    DE: 'Männlich',
    RU: 'Мужской'
  },
  'voice.female': {
    PT: 'Feminino',
    EN: 'Female',
    ES: 'Femenino',
    FR: 'Féminin',
    DE: 'Weiblich',
    RU: 'Женский'
  },
  'profile.eyeIntensity': {
    PT: 'Intensidade da Proteção Ocular',
    EN: 'Eye Protection Intensity',
    ES: 'Intensidad de la Protección Ocular',
    FR: 'Intensité de la Protection Oculaire',
    DE: 'Augenschutz-Intensität',
    RU: 'Интенсивность защиты глаз'
  },
  'login.welcome': {
    PT: 'Bem-vindo ao Kidreamers',
    EN: 'Welcome to Kidreamers',
    ES: 'Bienvenido a Kidreamers',
    FR: 'Bienvenue sur Kidreamers',
    DE: 'Willkommen bei Kidreamers',
    RU: 'Добро пожаловать в Kidreamers'
  },
  'login.description': {
    PT: 'Entre com sua conta Google para começar sua jornada de aprendizado.',
    EN: 'Sign in with your Google account to start your language learning adventure.',
    ES: 'Inicia sesión con tu cuenta de Google para comenzar tu viaje de aprendizaje.',
    FR: 'Connectez-vous avec votre compte Google pour commencer votre voyage d\'apprentissage.',
    DE: 'Melden Sie sich mit Ihrem Google-Konto an, um Ihre Sprachlernreise zu beginnen.',
    RU: 'Войдите с помощью своего аккаунта Google, чтобы начать свое приключение в изучении языков.'
  },
  'login.google': {
    PT: 'Continuar com Google',
    EN: 'Continue with Google',
    ES: 'Continuar con Google',
    FR: 'Continuer avec Google',
    DE: 'Mit Google fortfahren',
    RU: 'Продолжить через Google'
  },
  'login.terms': {
    PT: 'Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.',
    EN: 'By continuing, you agree to our Terms of Service and Privacy Policy.',
    ES: 'Al continuar, aceptas nossos Términos de Servicio y Política de Privacidad.',
    FR: 'En continuant, vous acceptez nos Conditions d\'Utilisation et notre Politique de Confidentialité.',
    DE: 'Indem Sie fortfahren, stimmen Sie unseren Nutzungsbedingungen und Datenschutzbestimmungen zu.',
    RU: 'Продолжая, вы соглашаетесь с нашими Условиями обслуживания и Политикой конфиденциальности.'
  }
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as AppTheme) || 'light';
  });

  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as AppLanguage) || 'EN';
  });

  const [translationLanguage, setTranslationLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('app-translation-language');
    return (saved as AppLanguage) || 'PT';
  });

  const [voiceGender, setVoiceGenderState] = useState<VoiceGender>(() => {
    const saved = localStorage.getItem('app-voice-gender');
    return (saved as VoiceGender) || 'female';
  });

  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem('app-font-size');
    return saved ? parseInt(saved, 10) : 24;
  });

  const [eyeProtectionIntensity, setEyeProtectionIntensityState] = useState<number>(() => {
    const saved = localStorage.getItem('app-eye-intensity');
    return saved ? parseInt(saved, 10) : 15;
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'eyeProtection');
    
    // Always add the current theme class to ensure consistency
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--eye-protection-opacity', (eyeProtectionIntensity / 100).toString());
    localStorage.setItem('app-eye-intensity', eyeProtectionIntensity.toString());
  }, [eyeProtectionIntensity]);

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-translation-language', translationLanguage);
  }, [translationLanguage]);

  useEffect(() => {
    localStorage.setItem('app-voice-gender', voiceGender);
  }, [voiceGender]);

  useEffect(() => {
    localStorage.setItem('app-font-size', fontSize.toString());
  }, [fontSize]);

  const setTheme = (t: AppTheme) => setThemeState(t);
  const setLanguage = (l: AppLanguage) => setLanguageState(l);
  const setTranslationLanguage = (l: AppLanguage) => setTranslationLanguageState(l);
  const setVoiceGender = (g: VoiceGender) => setVoiceGenderState(g);
  const setFontSize = (s: number) => setFontSizeState(s);
  const setEyeProtectionIntensity = (i: number) => setEyeProtectionIntensityState(i);

  const t = (key: string) => {
    return dictionary[key]?.[language] || key;
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      language, 
      setLanguage, 
      translationLanguage, 
      setTranslationLanguage, 
      voiceGender,
      setVoiceGender,
      fontSize,
      setFontSize,
      eyeProtectionIntensity,
      setEyeProtectionIntensity,
      t 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
