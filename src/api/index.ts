import { useQuery } from '@tanstack/react-query'
import { Track, Album, Playlist, Artist } from '../types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const fetchTracks = async (): Promise<Track[]> => {
  await delay(300 + Math.random() * 300)
  // Mock data
  return [
    { id: '1', title: 'Синий час', artist: 'Артём', album: 'Ночь', coverUrl: '/covers/1.jpg', audioUrl: '/audio/1.mp3', duration: 210, likes: 1200, genre: 'Pop' },
    { id: '2', title: 'Звёздный свет', artist: 'Лиза', album: 'Космос', coverUrl: '/covers/2.jpg', audioUrl: '/audio/2.mp3', duration: 185, likes: 850, genre: 'Electronic' },
    { id: '3', title: 'Дождь', artist: 'Макс', album: 'Осень', coverUrl: '/covers/3.jpg', audioUrl: '/audio/3.mp3', duration: 240, likes: 3000, genre: 'Jazz' },
    { id: '4', title: 'Огонь', artist: 'Катя', album: 'Лето', coverUrl: '/covers/4.jpg', audioUrl: '/audio/4.mp3', duration: 195, likes: 450, genre: 'Rock' },
    { id: '5', title: 'Ветер', artist: 'Илья', album: 'Весна', coverUrl: '/covers/5.jpg', audioUrl: '/audio/5.mp3', duration: 200, likes: 720, genre: 'Indie' },
    { id: '6', title: 'Море', artist: 'Анна', album: 'Лето', coverUrl: '/covers/6.jpg', audioUrl: '/audio/6.mp3', duration: 230, likes: 1100, genre: 'Pop' },
    { id: '7', title: 'Горы', artist: 'Дмитрий', album: 'Зима', coverUrl: '/covers/7.jpg', audioUrl: '/audio/7.mp3', duration: 215, likes: 900, genre: 'Rock' },
    { id: '8', title: 'Лес', artist: 'Ольга', album: 'Весна', coverUrl: '/covers/8.jpg', audioUrl: '/audio/8.mp3', duration: 175, likes: 560, genre: 'Folk' },
    { id: '9', title: 'Пустыня', artist: 'Сергей', album: 'Лето', coverUrl: '/covers/9.jpg', audioUrl: '/audio/9.mp3', duration: 260, likes: 2300, genre: 'Electronic' },
    { id: '10', title: 'Город', artist: 'Мария', album: 'Ночь', coverUrl: '/covers/10.jpg', audioUrl: '/audio/10.mp3', duration: 220, likes: 1500, genre: 'Pop' },
    { id: '11', title: 'Небо', artist: 'Павел', album: 'Космос', coverUrl: '/covers/11.jpg', audioUrl: '/audio/11.mp3', duration: 190, likes: 680, genre: 'Indie' },
    { id: '12', title: 'Луна', artist: 'Елена', album: 'Осень', coverUrl: '/covers/12.jpg', audioUrl: '/audio/12.mp3', duration: 250, likes: 1900, genre: 'Jazz' },
    { id: '13', title: 'Солнце', artist: 'Виктор', album: 'Лето', coverUrl: '/covers/13.jpg', audioUrl: '/audio/13.mp3', duration: 180, likes: 1300, genre: 'Rock' },
    { id: '14', title: 'Туман', artist: 'Наталья', album: 'Зима', coverUrl: '/covers/14.jpg', audioUrl: '/audio/14.mp3', duration: 205, likes: 420, genre: 'Folk' },
    { id: '15', title: 'Рассвет', artist: 'Роман', album: 'Весна', coverUrl: '/covers/15.jpg', audioUrl: '/audio/15.mp3', duration: 235, likes: 880, genre: 'Electronic' },
    { id: '16', title: 'Закат', artist: 'Светлана', album: 'Ночь', coverUrl: '/covers/16.jpg', audioUrl: '/audio/16.mp3', duration: 210, likes: 1400, genre: 'Pop' },
    { id: '17', title: 'Буря', artist: 'Алексей', album: 'Космос', coverUrl: '/covers/17.jpg', audioUrl: '/audio/17.mp3', duration: 270, likes: 2100, genre: 'Rock' },
    { id: '18', title: 'Тишина', artist: 'Татьяна', album: 'Осень', coverUrl: '/covers/18.jpg', audioUrl: '/audio/18.mp3', duration: 160, likes: 340, genre: 'Jazz' },
    { id: '19', title: 'Свет', artist: 'Константин', album: 'Лето', coverUrl: '/covers/19.jpg', audioUrl: '/audio/19.mp3', duration: 225, likes: 950, genre: 'Indie' },
    { id: '20', title: 'Тень', artist: 'Юлия', album: 'Зима', coverUrl: '/covers/20.jpg', audioUrl: '/audio/20.mp3', duration: 245, likes: 1700, genre: 'Electronic' },
  ]
}

export const useTracks = () => {
  return useQuery({
    queryKey: ['tracks'],
    queryFn: fetchTracks,
  })
}

export const fetchAlbum = async (id: string): Promise<Album> => {
  await delay(400)
  return {
    id,
    title: 'Синий час',
    artist: 'Артём',
    coverUrl: '/covers/1.jpg',
    tracks: [
      { id: '1', title: 'Синий час', artist: 'Артём', album: 'Ночь', coverUrl: '/covers/1.jpg', audioUrl: '/audio/1.mp3', duration: 210, likes: 1200, genre: 'Pop' },
      { id: '2', title: 'Звёздный свет', artist: 'Лиза', album: 'Космос', coverUrl: '/covers/2.jpg', audioUrl: '/audio/2.mp3', duration: 185, likes: 850, genre: 'Electronic' },
    ],
    releaseYear: 2026,
  }
}

export const useAlbum = (id: string) => {
  return useQuery({
    queryKey: ['album', id],
    queryFn: () => fetchAlbum(id),
  })
}

export const fetchPlaylist = async (id: string): Promise<Playlist> => {
  await delay(400)
  return {
    id,
    title: 'Моя волна',
    tracks: [
      { id: '1', title: 'Синий час', artist: 'Артём', album: 'Ночь', coverUrl: '/covers/1.jpg', audioUrl: '/audio/1.mp3', duration: 210, likes: 1200, genre: 'Pop' },
    ],
    isPublic: true,
  }
}

export const usePlaylist = (id: string) => {
  return useQuery({
    queryKey: ['playlist', id],
    queryFn: () => fetchPlaylist(id),
  })
}
