import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical, Star } from 'lucide-react';

export default function PhotoReorderModal({ photos, primaryPhoto, open, onClose, onSave }) {
  const [orderedPhotos, setOrderedPhotos] = useState(photos);
  const [primary, setPrimary] = useState(primaryPhoto);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(orderedPhotos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedPhotos(items);
  };

  const handleSave = () => {
    onSave(orderedPhotos, primary);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reorder Your Photos</DialogTitle>
          <p className="text-sm text-gray-500">Drag to reorder • Tap star to set primary</p>
        </DialogHeader>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="photos">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 max-h-96 overflow-y-auto"
              >
                {orderedPhotos.map((photo, index) => (
                  <Draggable key={photo} draggableId={photo} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-3 bg-gray-50 rounded-lg p-2"
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical size={20} className="text-gray-400" />
                        </div>
                        <img
                          src={photo}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <span className="text-sm text-gray-600 flex-1">Photo {index + 1}</span>
                        <Button
                          variant={primary === photo ? "default" : "ghost"}
                          size="icon"
                          onClick={() => setPrimary(photo)}
                          className={primary === photo ? "bg-amber-500 hover:bg-amber-600" : ""}
                        >
                          <Star size={16} />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700">
            Save Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}