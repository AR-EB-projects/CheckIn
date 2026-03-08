"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Card {
  id: string;
  cardCode: string;
  isActive: boolean;
}

interface Member {
  id: string;
  firstName: string;
  secondName: string;
  visitsTotal: number;
  visitsUsed: number;
  cards: Card[];
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [view, setView] = useState<'members' | 'questions'>('members');
  const [questions, setQuestions] = useState<any[]>([]);
  const router = useRouter();

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/admin/members");
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/admin/questions");
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'members') {
      fetchMembers();
    } else {
      fetchQuestions();
    }
  }, [view]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const handleDelete = async () => {
    if (!deletingMember) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/members/${deletingMember.id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setMembers(members.filter(m => m.id !== deletingMember.id));
        setDeletingMember(null);
      } else {
        alert("Грешка при изтриване на член.");
      }
    } catch (err) {
      console.error("Error deleting member:", err);
      alert("Грешка при изтриване на член.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="loading mb-4"></div>
      </div>
    </div>
  );

  return (
    <div className="container p-6 fade-in">
      <div className="flex-col flex items-center text-center mb-8">
        
        <h1 className="text-gold mb-2" style={{ fontSize: '2rem', fontWeight: '600' }}>
          Администраторски панел
        </h1>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => router.push("/admin/members/add")}
          className="btn btn-primary"
        >
          Добави член
        </button>
        <button 
          onClick={() => router.push("/admin/questions/add")}
          className="btn btn-primary"
        >
          Добави въпрос
        </button>
        <button 
          onClick={handleLogout}
          className="btn btn-secondary"
        >
          Изход
        </button>
      </div>

      {/* View Toggle Buttons */}
      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => setView('members')}
          style={{
            background: 'none',
            border: 'none',
            color: view === 'members' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            borderBottom: view === 'members' ? '3px solid var(--accent-gold)' : '3px solid transparent',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            padding: '12px 24px',
            borderRadius: '8px',
            letterSpacing: '0.5px',
            textShadow: view === 'members' ? '0 0 4px rgba(212, 175, 55, 0.3)' : 'none',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.textShadow = '0 0 6px rgba(212, 175, 55, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.textShadow = view === 'members' ? '0 0 4px rgba(212, 175, 55, 0.3)' : 'none';
          }}
        >
          Членове
        </button>
        <span style={{ 
          color: 'var(--accent-gold)', 
          fontSize: '22px', 
          fontWeight: '700', 
          margin: '0 8px',
          verticalAlign: 'middle',
          textShadow: '0 0 6px rgba(212, 175, 55, 0.4)',
          transition: 'all 0.3s ease'
        }}>|</span>
        <button 
          onClick={() => setView('questions')}
          style={{
            background: 'none',
            border: 'none',
            color: view === 'questions' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            borderBottom: view === 'questions' ? '3px solid var(--accent-gold)' : '3px solid transparent',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            padding: '12px 24px',
            borderRadius: '8px',
            letterSpacing: '0.5px',
            textShadow: view === 'questions' ? '0 0 4px rgba(212, 175, 55, 0.3)' : 'none',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.textShadow = '0 0 6px rgba(212, 175, 55, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.textShadow = view === 'questions' ? '0 0 4px rgba(212, 175, 55, 0.3)' : 'none';
          }}
        >
          Въпроси
        </button>
      </div>

      {/* Members Grid */}
      {view === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-gold mb-1" style={{ fontSize: '1.2rem' }}>
                    {member.firstName} {member.secondName}
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>ID: {member.id}</p>
                </div>
              </div>

              <div className="visit-info mb-6">
                <div className="visit-item">
                  <span className="visit-number">{member.visitsTotal}</span>
                  <div className="visit-label">Общо</div>
                </div>
                <div className="visit-item">
                  <span className="visit-number">{member.visitsUsed}</span>
                  <div className="visit-label">Използвани</div>
                </div>
                <div className="visit-item">
                  <span className="visit-number text-gold">
                    {member.visitsTotal - member.visitsUsed}
                  </span>
                  <div className="visit-label">Остават</div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-secondary text-sm mb-2">
                  Карти: {member.cards.length === 0 && <span className="text-muted">няма карти</span>}
                  {member.cards.map((card, idx) => (
                    <span key={card.id} className="text-gold font-mono">
                      {card.cardCode}{idx < member.cards.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
                <div className="flex flex-wrap gap-1">
                  {member.cards.map((card) => (
                    <span key={card.id} className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      card.isActive 
                        ? 'bg-green-900 text-green-200' 
                        : 'bg-red-900 text-red-200'
                    }`}>
                      {card.cardCode}: {card.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/admin/members/${member.id}/edit`)}
                  className="btn btn-secondary w-full"
                >
                  Edit
                </button>
                <button 
                  onClick={() => {
                    if (member.cards.length > 0) {
                      router.push(`/member/${member.cards[0].cardCode}`);
                    } else {
                      alert("Този член няма присвоена карта.");
                    }
                  }}
                  className="btn btn-primary w-full"
                >
                  Виж страницата
                </button>
                <button 
                  onClick={() => setDeletingMember(member)}
                  className="btn btn-error w-full"
                >
                  Изтрий член
                </button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="col-span-full text-center">
              <div className="alert alert-warning">
                <strong>Няма намерени членове</strong>
                <p className="mt-2 mb-0">Все още няма добавени членове в системата.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Questions Grid */}
      {view === 'questions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map((question, index) => (
            <div key={question.id || index} className="card">
              <div className="mb-4">
                <h3 className="text-gold mb-2" style={{ fontSize: '1rem', fontWeight: '600' }}>
                  Въпрос #{index + 1}
                </h3>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {new Date(question.createdAt).toLocaleDateString('bg-BG')}
                </p>
              </div>
              
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                lineHeight: '1.4',
                minHeight: '80px'
              }}>
                {question.text || question.question}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => router.push(`/admin/questions/${question.id}/edit`)}
                  className="btn btn-secondary w-full"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Сигурни ли сте, че искате да изтриете този въпрос?')) {
                      // TODO: Implement delete question
                    }
                  }}
                  className="btn btn-error w-full"
                >
                  Изтрий
                </button>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="col-span-full text-center">
              <div className="alert alert-warning">
                <strong>Няма намерени въпроси</strong>
                <p className="mt-2 mb-0">Все още няма добавени въпроси в системата.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {deletingMember && (
        <div className="modal-overlay">
          <div className="modal-content fade-in">
            <h3 className="text-gold mb-4">Потвърждение</h3>
            <p className="mb-6">
              Сигурни ли сте, че искате да изтриете член <br />
              <strong>{deletingMember.firstName} {deletingMember.secondName}</strong>?
              <br />
              <span className="text-error" style={{ fontSize: '0.85rem' }}>
                Това действие е необратимо и ще изтрие и свързаната карта.
              </span>
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setDeletingMember(null)}
                className="btn btn-secondary px-6"
                disabled={isDeleting}
              >
                Отказ
              </button>
              <button 
                onClick={handleDelete}
                className="btn btn-error px-6"
                disabled={isDeleting}
              >
                {isDeleting ? "Изтриване..." : "Изтрий"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
