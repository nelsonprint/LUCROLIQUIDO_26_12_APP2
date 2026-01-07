import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '../App';
import { PlayCircle, X, ChevronDown, ChevronUp, GripHorizontal, Video, AlertCircle } from 'lucide-react';

const PassoAPasso = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [playerPosition, setPlayerPosition] = useState({ x: 20, y: window.innerHeight - 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [videoError, setVideoError] = useState(false);
  const playerRef = useRef(null);

  useEffect(() => {
    if (isOpen && videos.length === 0) {
      fetchVideos();
    }
  }, [isOpen]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/videos-passo-a-passo');
      setVideos(response.data);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    setActiveVideo(video);
    setVideoError(false);
    setIsOpen(false);
  };

  const closePlayer = () => {
    setActiveVideo(null);
    setVideoError(false);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const rect = playerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && playerRef.current) {
      const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 300, e.clientY - dragOffset.y));
      setPlayerPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
    return url;
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50">
        <div className="relative">
          {isOpen && (
            <div className="absolute bottom-14 left-0 w-80 max-h-96 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl mb-2">
              <div className="p-3 border-b border-zinc-700 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-400" />
                  Vídeos de Treinamento
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2">
                {loading ? (
                  <div className="p-4 text-center text-zinc-400">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" />
                    Carregando...
                  </div>
                ) : videos.length === 0 ? (
                  <div className="p-4 text-center text-zinc-500">
                    <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Nenhum vídeo cadastrado ainda.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {videos.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => handleVideoClick(video)}
                        className="w-full p-3 text-left rounded-lg hover:bg-zinc-800 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30">
                            <PlayCircle className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{video.titulo}</p>
                            {video.descricao && <p className="text-xs text-zinc-500 truncate">{video.descricao}</p>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <Button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 px-4 py-2">
            <PlayCircle className="w-5 h-5" />
            Passo a Passo
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {activeVideo && (
        <div
          ref={playerRef}
          className="fixed z-[100] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden"
          style={{ left: playerPosition.x, top: playerPosition.y, width: '400px', minHeight: '280px' }}
          onMouseDown={handleMouseDown}
        >
          <div className="drag-handle bg-zinc-800 px-3 py-2 flex items-center justify-between cursor-move select-none">
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-white truncate max-w-[280px]">{activeVideo.titulo}</span>
            </div>
            <button onClick={closePlayer} className="p-1 hover:bg-zinc-700 rounded transition-colors">
              <X className="w-4 h-4 text-zinc-400 hover:text-white" />
            </button>
          </div>
          <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
            {videoError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-400">
                <AlertCircle className="w-10 h-10 mb-2 text-red-400" />
                <p className="text-sm">Não foi possível carregar o vídeo.</p>
                <button onClick={() => setVideoError(false)} className="mt-2 text-xs text-blue-400 hover:underline">Tentar novamente</button>
              </div>
            ) : (
              <iframe
                src={getEmbedUrl(activeVideo.url)}
                title={activeVideo.titulo}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setVideoError(true)}
              />
            )}
          </div>
          {activeVideo.descricao && (
            <div className="px-3 py-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-400">{activeVideo.descricao}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PassoAPasso;
