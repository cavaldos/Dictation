import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { RootState } from '~/redux/store';
import {
    addNoteGroup,
    removeNoteGroup,
    updateNoteGroup,
    setActiveGroup,
    addWordToGroup,
    removeWordFromGroup,
    NOTE_COLORS,
} from '~/redux/features/noteSlice';

const NoteWord: React.FC = () => {
    const dispatch = useDispatch();
    const { groups, activeGroupId } = useSelector((state: RootState) => state.notes);

    const [inputValue, setInputValue] = useState("");
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupColor, setNewGroupColor] = useState("blue");
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingGroupName, setEditingGroupName] = useState("");
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const inputRef = useRef<HTMLInputElement>(null);
    const newGroupInputRef = useRef<HTMLInputElement>(null);

    const getColorClasses = (colorName: string) => {
        return NOTE_COLORS.find(c => c.name === colorName) || NOTE_COLORS[0];
    };

    const handleAddWord = (groupId: string, value: string) => {
        const trimmed = value.trim();
        if (trimmed !== "") {
            dispatch(addWordToGroup({ groupId, word: trimmed }));
        }
        setInputValue("");
    };

    const handleDeleteWord = (groupId: string, wordIndex: number) => {
        dispatch(removeWordFromGroup({ groupId, wordIndex }));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAddWord(groupId, inputValue);
        } else if (e.key === 'Backspace' && inputValue === "") {
            const group = groups.find(g => g.id === groupId);
            if (group && group.words.length > 0) {
                dispatch(removeWordFromGroup({ groupId, wordIndex: group.words.length - 1 }));
            }
        }
    };

    const handleAddGroup = () => {
        if (newGroupName.trim()) {
            dispatch(addNoteGroup({ name: newGroupName.trim(), color: newGroupColor }));
            setNewGroupName("");
            setNewGroupColor("blue");
            setIsAddingGroup(false);
        }
    };

    const handleDeleteGroup = (groupId: string) => {
        if (groups.length > 1) {
            dispatch(removeNoteGroup(groupId));
        }
    };

    const handleStartEditGroup = (groupId: string, currentName: string) => {
        setEditingGroupId(groupId);
        setEditingGroupName(currentName);
    };

    const handleSaveEditGroup = (groupId: string) => {
        if (editingGroupName.trim()) {
            dispatch(updateNoteGroup({ id: groupId, name: editingGroupName.trim() }));
        }
        setEditingGroupId(null);
        setEditingGroupName("");
    };

    const handleCancelEditGroup = () => {
        setEditingGroupId(null);
        setEditingGroupName("");
    };

    const toggleCollapse = (groupId: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleGroupClick = (groupId: string) => {
        dispatch(setActiveGroup(groupId));
    };

    return (
        <div className="flex flex-col gap-3 p-2">
            {/* Header with Add button */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">Note Groups</h3>
                <button
                    onClick={() => {
                        setIsAddingGroup(true);
                        setTimeout(() => newGroupInputRef.current?.focus(), 100);
                    }}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title="Add new group"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Add new group form */}
            {isAddingGroup && (
                <div className="bg-[rgb(45,45,45)] border border-gray-600 rounded-lg p-3 space-y-2">
                    <input
                        ref={newGroupInputRef}
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddGroup();
                            if (e.key === 'Escape') setIsAddingGroup(false);
                        }}
                        placeholder="Group name..."
                        className="w-full bg-[rgb(35,35,35)] border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {/* Color picker */}
                    <div className="flex flex-wrap gap-1">
                        {NOTE_COLORS.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => setNewGroupColor(color.name)}
                                className={`w-6 h-6 rounded-full ${color.bg} ${color.border} border-2 transition-all ${
                                    newGroupColor === color.name ? 'ring-2 ring-white ring-offset-1 ring-offset-[rgb(45,45,45)]' : ''
                                }`}
                                title={color.name}
                            />
                        ))}
                    </div>
                    {/* Action buttons */}
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsAddingGroup(false)}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddGroup}
                            disabled={!newGroupName.trim()}
                            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                        >
                            Add Group
                        </button>
                    </div>
                </div>
            )}

            {/* Note Groups */}
            <div className="space-y-2">
                {(groups || []).map((group) => {
                    const colorClasses = getColorClasses(group.color);
                    const isCollapsed = collapsedGroups.has(group.id);
                    const isActive = activeGroupId === group.id;
                    const isEditing = editingGroupId === group.id;

                    return (
                        <div
                            key={group.id}
                            className={`rounded-lg border transition-all ${
                                isActive 
                                    ? 'border-blue-500/50 bg-[rgb(40,40,40)]' 
                                    : 'border-gray-700 bg-[rgb(35,35,35)] hover:border-gray-600'
                            }`}
                        >
                            {/* Group Header */}
                            <div
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                                onClick={() => handleGroupClick(group.id)}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCollapse(group.id);
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </button>

                                {/* Color indicator */}
                                <div className={`w-3 h-3 rounded-full ${colorClasses.bg} ${colorClasses.border} border`} />

                                {/* Group name (editable) */}
                                {isEditing ? (
                                    <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editingGroupName}
                                            onChange={(e) => setEditingGroupName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEditGroup(group.id);
                                                if (e.key === 'Escape') handleCancelEditGroup();
                                            }}
                                            className="flex-1 bg-transparent border-b border-gray-500 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSaveEditGroup(group.id)}
                                            className="p-0.5 text-green-400 hover:text-green-300"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={handleCancelEditGroup}
                                            className="p-0.5 text-red-400 hover:text-red-300"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="flex-1 text-sm text-gray-200 truncate">{group.name}</span>
                                )}

                                {/* Word count */}
                                <span className="text-xs text-gray-500">{group.words.length}</span>

                                {/* Actions */}
                                {!isEditing && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEditGroup(group.id, group.name);
                                            }}
                                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                                            title="Edit group"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        {groups.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteGroup(group.id);
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                                                title="Delete group"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Group Content (Words) */}
                            {!isCollapsed && (
                                <div
                                    onClick={() => {
                                        handleGroupClick(group.id);
                                        inputRef.current?.focus();
                                    }}
                                    className="px-3 pb-3"
                                >
                                    <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] cursor-text">
                                        {group.words.map((word, index) => (
                                            <div
                                                key={index}
                                                className={`${colorClasses.bg} ${colorClasses.border} ${colorClasses.text} ${colorClasses.hover} border rounded-full px-2.5 py-0.5 text-xs inline-flex items-center gap-1 group/tag transition-colors`}
                                            >
                                                <span>{word}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteWord(group.id, index);
                                                    }}
                                                    className="opacity-0 group-hover/tag:opacity-100 hover:text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-xs leading-none transition-all"
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {isActive && (
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, group.id)}
                                                placeholder={group.words.length === 0 ? "Type and press Enter..." : ""}
                                                className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-xs text-gray-300 placeholder:text-gray-500"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NoteWord;
