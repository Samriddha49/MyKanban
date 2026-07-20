import { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { boardApi, listApi, cardApi, labelApi } from '../api/endpoints';
import type { Board, BoardList, CardItem, Label } from '../types';
import TopNav from '../components/TopNav';
import CardModal from '../components/CardModal';

export default function BoardPage() {
  const { boardId } = useParams();
  const boardIdNum = Number(boardId);

  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<BoardList[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [newListName, setNewListName] = useState('');
  const [addingCardToList, setAddingCardToList] = useState<number | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CardItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = async () => {
    try {
      const [boardRes, listsRes, labelsRes] = await Promise.all([
        boardApi.get(boardIdNum),
        listApi.listByBoard(boardIdNum),
        labelApi.listByBoard(boardIdNum),
      ]);
      setBoard(boardRes.data);
      setLists(listsRes.data.sort((a, b) => a.position - b.position));
      setLabels(labelsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load board.');
    }
  };

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardIdNum]);

  const handleCreateList = async (e: FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      await listApi.create(boardIdNum, newListName.trim());
      setNewListName('');
      loadBoard();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create list.');
    }
  };

  const handleCreateCard = async (listId: number, e: FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    try {
      await cardApi.create(listId, newCardTitle.trim());
      setNewCardTitle('');
      setAddingCardToList(null);
      loadBoard();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create card.');
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const { data } = await cardApi.search(boardIdNum, searchQuery.trim());
    setSearchResults(data);
  };

  // Optimistic drag-and-drop reordering. On drop, we update local state immediately,
  // then persist the move via the API; on failure we reload from the server.
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'CARD') {
      const sourceListId = Number(source.droppableId);
      const targetListId = Number(destination.droppableId);
      const cardId = Number(draggableId);

      // Optimistic local update
      setLists((prev) => {
        const next = prev.map((l) => ({ ...l, cards: [...l.cards] }));
        const sourceList = next.find((l) => l.id === sourceListId)!;
        const targetList = next.find((l) => l.id === targetListId)!;
        const [moved] = sourceList.cards.splice(source.index, 1);
        targetList.cards.splice(destination.index, 0, moved);
        return next;
      });

      try {
        await cardApi.move(cardId, targetListId, destination.index);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to move card.');
        loadBoard();
      }
    } else if (type === 'LIST') {
      const listId = Number(draggableId);
      setLists((prev) => {
        const next = [...prev];
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        return next;
      });
      try {
        await listApi.move(listId, destination.index);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to move list.');
        loadBoard();
      }
    }
  };

  const displayLists = searchResults
    ? lists.map((l) => ({ ...l, cards: searchResults.filter((c) => c.listId === l.id) }))
    : lists;

  return (
    <div>
      <TopNav title={board?.name || 'Board'} />
      <div className="board-toolbar">
        <form onSubmit={handleSearch}>
          <input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        {searchResults && (
          <button className="btn secondary" onClick={() => { setSearchQuery(''); setSearchResults(null); }}>
            Clear search
          </button>
        )}
      </div>

      {error && <div className="error-text" style={{ paddingLeft: 20 }}>{error}</div>}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(boardProvided) => (
            <div className="board-columns" ref={boardProvided.innerRef} {...boardProvided.droppableProps}>
              {displayLists.map((list, listIndex) => (
                <Draggable key={list.id} draggableId={`list-${list.id}`} index={listIndex}>
                  {(listProvided) => (
                    <div
                      className="board-column"
                      ref={listProvided.innerRef}
                      {...listProvided.draggableProps}
                    >
                      <div className="board-column-header" {...listProvided.dragHandleProps}>
                        <span>{list.name}</span>
                        <span style={{ fontWeight: 400, fontSize: 12 }}>{list.cards.length}</span>
                      </div>

                      <Droppable droppableId={String(list.id)} type="CARD">
                        {(cardProvided) => (
                          <div ref={cardProvided.innerRef} {...cardProvided.droppableProps}>
                            {list.cards.map((card, cardIndex) => (
                              <Draggable key={card.id} draggableId={String(card.id)} index={cardIndex}>
                                {(dragProvided) => (
                                  <div
                                    className="kanban-card"
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={() => setOpenCardId(card.id)}
                                  >
                                    <div>
                                      {card.labels.map((l) => (
                                        <span key={l.id} className="label-chip" style={{ background: l.color }} />
                                      ))}
                                    </div>
                                    <div>{card.title}</div>
                                    <div className="meta">
                                      {card.dueDate && <span>Due {card.dueDate}</span>}
                                      {card.assignees.length > 0 && (
                                        <span>{card.assignees.map((a) => a.name).join(', ')}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {cardProvided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {addingCardToList === list.id ? (
                        <form className="add-card-form" onSubmit={(e) => handleCreateCard(list.id, e)}>
                          <textarea
                            autoFocus
                            placeholder="Card title"
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <button className="btn" type="submit">Add card</button>
                            <button
                              className="btn secondary"
                              type="button"
                              onClick={() => setAddingCardToList(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          className="btn secondary"
                          style={{ width: '100%', marginTop: 6 }}
                          onClick={() => setAddingCardToList(list.id)}
                        >
                          + Add a card
                        </button>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {boardProvided.placeholder}

              <div className="add-list-column">
                <form onSubmit={handleCreateList}>
                  <input
                    placeholder="+ Add another list"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                </form>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {openCardId && (
        <CardModal
          cardId={openCardId}
          boardId={boardIdNum}
          onClose={() => setOpenCardId(null)}
          onChanged={loadBoard}
        />
      )}
    </div>
  );
}
