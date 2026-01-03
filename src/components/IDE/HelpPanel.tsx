import { useState, useMemo } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { BookOpen, Code, Terminal, GitBranch, Zap, Layers, X, ChevronLeft, Menu, Keyboard, Command } from 'lucide-react';
import { clsx } from 'clsx';
import { logger } from '@/utils/logger';

// Rest of the help panel content and structure remains the same...

export function HelpPanel({ className }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('quick');
  const [selectedSection, setSelectedSection] = useState('quick-reference');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Just read the state, we don't need to assign it
  useIDEStore((state) => state.helpOpen);
  const toggleHelp = useIDEStore((state) => state.toggleHelp);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return DOCUMENTATION_CATEGORIES;

    return DOCUMENTATION_CATEGORIES.map(category => ({
      ...category,
      sections: category.sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.sections.length > 0);
  }, [searchQuery]);

  const currentSection = useMemo(() => {
    const category = DOCUMENTATION_CATEGORIES.find(cat => cat.id === selectedCategory);
    return category?.sections.find(sec => sec.id === selectedSection);
  }, [selectedCategory, selectedSection]);

  const handleSectionSelect = (categoryId: string, sectionId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSection(sectionId);
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  // Render help content
  return (
    <div className={clsx('help-panel flex h-full bg-gray-900 text-gray-100', className)}>
      {/* Sidebar */}
      {!sidebarCollapsed && (
        <div className="w-64 border-r border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Help & Documentation
              </h2>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 hover:bg-gray-700 rounded md:hidden"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-2">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded text-left font-medium',
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-800'
                  )}
                >
                  {category.icon}
                  {category.name}
                </button>

                {selectedCategory === category.id && category.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionSelect(category.id, section.id)}
                    className={clsx(
                      'w-full flex items-center gap-2 px-6 py-2 rounded text-left text-sm',
                      selectedSection === section.id
                        ? 'bg-blue-900 text-blue-300'
                        : 'hover:bg-gray-800 text-gray-300'
                    )}
                  >
                    {section.icon}
                    {section.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1 hover:bg-gray-700 rounded md:hidden"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-xl font-semibold">{currentSection?.title}</h1>
          </div>
          <button
            onClick={() => toggleHelp?.()}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentSection?.description || 'Select a section from the sidebar to view documentation.'}
        </div>
      </div>
    </div>
  );
}

const DOCUMENTATION_CATEGORIES = [
  {
    id: 'quick',
    name: 'Quick Reference',
    icon: <Zap className="w-4 h-4" />,
    sections: [
      { id: 'quick-reference', title: 'Keyboard Shortcuts', description: 'Essential keyboard shortcuts', icon: <Keyboard className="w-4 h-4" /> },
      { id: 'commands', title: 'Command Palette', description: 'Access all commands', icon: <Command className="w-4 h-4" /> },
    ],
  },
  {
    id: 'features',
    name: 'Features',
    icon: <Layers className="w-4 h-4" />,
    sections: [
      { id: 'editor', title: 'Editor', description: 'Code editor features', icon: <Code className="w-4 h-4" /> },
      { id: 'terminal', title: 'Terminal', description: 'Integrated terminal', icon: <Terminal className="w-4 h-4" /> },
      { id: 'git', title: 'Git Integration', description: 'Version control', icon: <GitBranch className="w-4 h-4" /> },
    ],
  },
];

export default HelpPanel;
