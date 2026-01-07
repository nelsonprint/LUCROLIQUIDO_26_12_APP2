import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Video, Plus, Edit, Trash2, GripVertical, Play, ExternalLink, Loader2 } from 'lucide-react';

const AdminVideos = ({ user, onLogout }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    url: '',
    descricao: '',
    ordem: 0
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/videos-passo-a-passo');
      setVideos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (video = null) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        titulo: video.titulo || '',
        url: video.url || '',
        descricao: video.descricao || '',
        ordem: video.ordem || 0
      });
    } else {
      setEditingVideo(null);
      setFormData({
        titulo: '',
        url: '',
        descricao: '',
        ordem: videos.length
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    
    if (!formData.url.trim()) {
      toast.error('URL do vídeo é obrigatória');
      return;
    }

    try {
      setLoading(true);

      if (editingVideo) {
        await axiosInstance.put(`/admin/videos-passo-a-passo/${editingVideo.id}`, formData);
        toast.success('Vídeo atualizado!');
      } else {
        await axiosInstance.post('/admin/videos-passo-a-passo', formData);
        toast.success('Vídeo cadastrado!');
      }

      setShowModal(false);
      fetchVideos();
    } catch (error) {
      toast.error('Erro ao salvar vídeo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este vídeo?')) return;

    try {
      await axiosInstance.delete(`/admin/videos-passo-a-passo/${id}`);
      toast.success('Vídeo excluído!');
      fetchVideos();
    } catch (error) {
      toast.error('Erro ao excluir vídeo');
    }
  };

  const handleToggle = async (video) => {
    try {
      await axiosInstance.patch(`/admin/videos-passo-a-passo/${video.id}/toggle`);
      toast.success(`Vídeo ${video.ativo ? 'desativado' : 'ativado'}!`);
      fetchVideos();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const getVideoThumbnail = (url) => {
    const youtubeMatch = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="admin-videos" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Video className="w-8 h-8 text-blue-400" />
                Vídeos Passo a Passo
              </h1>
              <p className="text-zinc-400 mt-1">Gerencie os vídeos de treinamento do sistema</p>
            </div>
            <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Novo Vídeo
            </Button>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Total de Vídeos</p>
                    <p className="text-2xl font-bold">{videos.length}</p>
                  </div>
                  <Video className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Ativos</p>
                    <p className="text-2xl font-bold text-green-400">{videos.filter(v => v.ativo).length}</p>
                  </div>
                  <Play className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Inativos</p>
                    <p className="text-2xl font-bold text-zinc-500">{videos.filter(v => !v.ativo).length}</p>
                  </div>
                  <Video className="w-8 h-8 text-zinc-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Vídeos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Lista de Vídeos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum vídeo cadastrado</p>
                  <p className="text-sm mt-2">Clique em "Novo Vídeo" para adicionar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Vídeo</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videos.map((video, index) => (
                        <TableRow key={video.id} className="border-zinc-800 hover:bg-zinc-800/50">
                          <TableCell className="text-zinc-500">
                            <GripVertical className="w-4 h-4" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getVideoThumbnail(video.url) ? (
                                <img 
                                  src={getVideoThumbnail(video.url)} 
                                  alt={video.titulo}
                                  className="w-20 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-20 h-12 bg-zinc-800 rounded flex items-center justify-center">
                                  <Play className="w-6 h-6 text-zinc-600" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{video.titulo}</p>
                                {video.descricao && (
                                  <p className="text-xs text-zinc-500 truncate max-w-[200px]">{video.descricao}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <a 
                              href={video.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Abrir
                            </a>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={video.ativo}
                                onCheckedChange={() => handleToggle(video)}
                              />
                              <Badge 
                                variant="outline" 
                                className={video.ativo 
                                  ? 'border-green-500/50 text-green-400' 
                                  : 'border-zinc-500/50 text-zinc-400'
                                }
                              >
                                {video.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenModal(video)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(video.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-400" />
              {editingVideo ? 'Editar Vídeo' : 'Novo Vídeo'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                placeholder="Ex: Como criar um orçamento"
                required
              />
            </div>

            <div>
              <Label htmlFor="url">URL do Vídeo *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                placeholder="https://youtube.com/watch?v=..."
                required
              />
              <p className="text-xs text-zinc-500 mt-1">
                Suporta YouTube, Vimeo e Loom
              </p>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                placeholder="Breve descrição do conteúdo do vídeo..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="ordem">Ordem de Exibição</Label>
              <Input
                id="ordem"
                type="number"
                min="0"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                className="bg-zinc-800 border-zinc-700 w-24"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="border-zinc-700">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingVideo ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVideos;
