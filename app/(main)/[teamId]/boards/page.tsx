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
    <div className="flex flex-col space-y-3 sm:space-y-4 md:space-y-6 min-h-screen p-3 sm:p-4 md:p-6 pt-0">
      {/* Header Card */}
      <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                Boards
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                Manage and organize your tasks with Kanban boards
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Create Board
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row items-start gap-3 sm:gap-4 md:gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-3 sm:gap-4 md:gap-6">
          {/* Search Card */}
          <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4">
            <div className="relative w-full">
              <Search className="absolute left-2 sm:left-3 top-2 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search boards..."
                className="w-full rounded-lg border bg-background py-1.5 sm:py-2 pl-8 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Categories Card */}
          <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4 md:p-6">
            <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
              Categories
            </h3>
            <div className="space-y-1 sm:space-y-2">
              {categories.map(category => (
                <Button 
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"} 
                  className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="truncate">{category}</span>
                  <span className={`ml-auto text-[10px] sm:text-xs py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-full ${
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
        <div className="flex-1 w-full bg-background rounded-xl shadow-lg border p-3 sm:p-4 md:p-6">
          <ScrollArea className="w-full">
            <div className="min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
              {filteredBoards.length > 0 ? (
                <BoardsList boards={filteredBoards} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 text-center px-3">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-5 md:mb-6">
                    <LayoutGrid className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2">
                    {searchTerm || selectedCategory !== 'All Boards' ? 'No boards found' : 'No boards yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4 sm:mb-5 md:mb-6 max-w-md text-xs sm:text-sm md:text-base">
                    {searchTerm || selectedCategory !== 'All Boards' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first board to start organizing your team\'s tasks'
                    }
                  </p>
                  {!searchTerm && selectedCategory === 'All Boards' && (
                    <Button onClick={() => setOpen(true)} className="text-xs sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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