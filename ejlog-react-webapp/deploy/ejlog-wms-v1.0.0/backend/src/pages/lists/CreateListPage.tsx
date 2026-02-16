// ============================================================================
// EJLOG WMS - Create List Page
// Creazione nuova lista
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateListMutation } from '../../services/api/listsApi';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';

const CreateListPage: React.FC = () => {
  const navigate = useNavigate();
  const [createList, { isLoading }] = useCreateListMutation();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    priority: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createList(formData as any).unwrap();
      if (result.data) {
        navigate(`/lists/${result.data.id}`);
      }
    } catch (error) {
      alert('Errore durante la creazione');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Nuova Lista</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Codice *"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label="Priorità"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
          />

          <div className="flex space-x-3">
            <Button type="submit" variant="primary" loading={isLoading}>
              Crea Lista
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/lists')}>
              Annulla
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateListPage;
