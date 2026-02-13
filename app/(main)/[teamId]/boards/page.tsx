"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BoardsList } from "@/components/boards/boards-list";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { Plus, Search, LayoutGrid } from "lucide-react";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BoardProps } from "@/components/boards/boards-list";
import { LoadingPage } from "@/components/ui/loading-page";

export default function BoardsPage() {
  const params = useParams() || {};
  const teamId = params.teamId as string;
  const [boards, setBoards] = useState<BoardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Boards');

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}/boards`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch team data');
        }        
        const data = await response.json();
        setBoards(data.boards);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [teamId]);

  const handleCreateBoard = async (newBoard: Omit<BoardProps, '_id'>) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBoard),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create board');
      }
      
      const data = await response.json();
      setBoards([...boards, data.board]);
      setOpen(false);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const filteredBoards = boards
    .filter(board => 
      board.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      board.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(board => 
      selectedCategory === 'All Boards' || 
      board.category === selectedCategory
    );

  // Count boards by category
  const categorySet = new Set(['All Boards']);
  boards.forEach(board => {
    if (board.category) {
      categorySet.add(board.category);
    } else {
      categorySet.add('General');
    }
  });
  const categories = Array.from(categorySet);
  
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = category === 'All Boards' 
      ? boards.length
      : boards.filter(board => board.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <div>
    <LoadingPage />
  </div>;

  return (
    <div className="flex flex-col space-y-6 min-h-screen p-6 pt-0">
      {/* Header Card */}
      <div className="bg-background rounded-xl shadow-lg border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Boards
              </h1>
              <p className="text-muted-foreground">
                Manage and organize your tasks with Kanban boards
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Board
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Search Card */}
          <div className="bg-background rounded-xl shadow-lg border p-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search boards..."
                className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Categories Card */}
          <div className="bg-background rounded-xl shadow-lg border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Categories
            </h3>
            <div className="space-y-2">
              {categories.map(category => (
                <Button 
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category)}
                >
                  <span>{category}</span>
                  <span className={`ml-auto text-xs py-1 px-2 rounded-full ${
                    selectedCategory === category 
                      ? 'bg-primary-foreground/20' 
                      : 'bg-muted'
                  }`}>
                    {categoryCounts[category] || 0}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content Card */}
        <div className="flex-1 w-full bg-background rounded-xl shadow-lg border p-6">
          <ScrollArea className="w-full">
            <div className="min-h-[400px]">
              {filteredBoards.length > 0 ? (
                <BoardsList boards={filteredBoards} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <LayoutGrid className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {searchTerm || selectedCategory !== 'All Boards' ? 'No boards found' : 'No boards yet'}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {searchTerm || selectedCategory !== 'All Boards' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first board to start organizing your team\'s tasks'
                    }
                  </p>
                  {!searchTerm && selectedCategory === 'All Boards' && (
                    <Button onClick={() => setOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Board
                    </Button>
                  )}
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      
      <CreateBoardDialog 
        open={open} 
        onOpenChange={setOpen} 
        onCreateBoard={handleCreateBoard}
        teamId={teamId}
      />
    </div>
  );
}