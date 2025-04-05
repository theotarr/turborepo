"use client";

import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  RotateCw,
  Search,
  Sparkles,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { UseChatHelpers } from "@ai-sdk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useResizeDetector } from "react-resize-detector";
import { toast } from "sonner";
import { z } from "zod";

import { Icons } from "./icons";
import { useChatUIStore, useTabStore } from "./notes-page";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfRendererProps {
  lectureId: string;
  append: UseChatHelpers["append"];
  url: string;
  className?: string;
}

interface PopupPosition {
  x: number;
  y: number;
}

// Memoize document options to prevent unnecessary re-renders
const documentOptions = {
  cMapUrl: "https://unpkg.com/pdfjs-dist@3.4.120/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/",
};

export const PdfRenderer = ({ url, className, append }: PdfRendererProps) => {
  const { setIsLoading, setScrollToBottom } = useChatUIStore();
  const { setActiveTab } = useTabStore();

  const [numPages, setNumPages] = useState<number>();
  const [currPage, setCurrPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const [resizing, setResizing] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  // State for text selection popup
  const [selectedText, setSelectedText] = useState<string>("");
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>({
    x: 0,
    y: 0,
  });

  const documentRef = useRef<HTMLDivElement>(null);

  const CustomPageValidator = z.object({
    page: z
      .string()
      .refine((num) => Number(num) > 0 && Number(num) <= numPages!),
  });

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCustomPageValidator>({
    defaultValues: {
      page: "1",
    },
    resolver: zodResolver(CustomPageValidator),
  });

  const { width, ref } = useResizeDetector({
    handleWidth: true,
    handleHeight: false,
    refreshMode: "debounce",
    refreshRate: 10,
    onResize: () => {
      // Set resizing flag when resize starts
      setResizing(true);

      // Clear resizing flag after resize is complete
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        setResizing(false);
      }, 500);
    },
  });

  // Calculate the appropriate width for the PDF page with strict container constraints
  const calculatePageWidth = () => {
    if (!width) return 1; // Use a default value instead of undefined
    // More aggressive padding to ensure fit within container
    return width > 50 ? width - 50 : width;
  };

  // Setup intersection observers for pages with proper dependencies
  useEffect(() => {
    if (!numPages) return;

    // Clean up old observers
    if (pageObservers.length > 0) {
      pageObservers.forEach((observer) => observer.disconnect());
    }

    // Create a single observer for all pages
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the largest intersection ratio
        let maxRatio = 0;
        let maxPageNumber = 0;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const pageNumber = Number(
              entry.target.getAttribute("data-page-number"),
            );
            if (pageNumber) {
              maxPageNumber = pageNumber;
            }
          }
        });

        // Update current page if we found a visible page
        if (maxPageNumber > 0 && maxPageNumber !== currPage) {
          setCurrPage(maxPageNumber);
          setValue("page", String(maxPageNumber));
        }
      },
      {
        threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        root: null, // Use viewport as root
      },
    );

    setPageObservers([observer]);

    // Wait for pages to render, then connect observer
    setTimeout(() => {
      const pageElements =
        documentRef.current?.querySelectorAll("[data-page-number]");
      if (pageElements) {
        pageElements.forEach((pageEl) => {
          observer.observe(pageEl);
        });
      }
    }, 500);

    return () => {
      observer.disconnect();
    };
  }, [numPages]); // Only recreate when numPages changes

  // Properly initialize the refs
  useEffect(() => {
    pagesRef.current = Array(numPages || 0).fill(null);
  }, [numPages]);

  const goToPage = (page: number) => {
    if (page < 1 || page > (numPages || 1)) return;

    // Update the current page immediately
    setCurrPage(page);
    setValue("page", String(page));

    // Use a timeout to ensure the DOM is fully updated
    setTimeout(() => {
      try {
        // Store window scroll position before scrolling
        const windowScrollY = window.scrollY;
        const windowScrollX = window.scrollX;

        // Find the target element
        const targetElement = document.getElementById(`pdf-page-${page}`);

        if (targetElement) {
          // Use scrollIntoView for reliability
          targetElement.scrollIntoView({ block: "start", behavior: "auto" });

          // Restore the window scroll position immediately to prevent page movement
          window.scrollTo(windowScrollX, windowScrollY);
        } else {
          // Fallback to using the data attribute if ID is not found
          const targetPageDiv = Array.from(
            documentRef.current?.querySelectorAll("[data-page-number]") || [],
          ).find((el) => Number(el.getAttribute("data-page-number")) === page);

          if (targetPageDiv) {
            // Use scrollIntoView for the found element
            targetPageDiv.scrollIntoView({ block: "start", behavior: "auto" });

            // Restore the window scroll position immediately
            window.scrollTo(windowScrollX, windowScrollY);
          }
        }
      } catch (error) {
        console.error("Error scrolling to page:", error);
      }
    }, 100);
  };

  // Handle page input submission
  const handlePageSubmit = ({ page }: TCustomPageValidator) => {
    const pageNumber = Number(page);
    if (pageNumber >= 1 && pageNumber <= (numPages || 1)) {
      goToPage(pageNumber);
    }
  };

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();

    if (selection && selection.toString().trim().length > 0) {
      const selectedText = selection.toString().trim();
      setSelectedText(selectedText);

      // Get the position of the selection
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Calculate position for the popup
      if (documentRef.current) {
        const docRect = documentRef.current.getBoundingClientRect();
        setPopupPosition({
          x: rect.left + rect.width / 2 - docRect.left,
          y: rect.top - docRect.top - 54, // Increased from 10px to 40px for higher positioning
        });
      }

      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  };

  // Hide popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showPopup &&
        documentRef.current &&
        !documentRef.current.contains(e.target as Node)
      ) {
        setShowPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopup]);

  // Handle actions.
  const handleAction = async (action: string) => {
    const input = `${action}${selectedText}`;

    setIsLoading(true);
    setActiveTab("chat");
    setShowPopup(false);

    // Submit the user message to the server.
    try {
      append({
        role: "user",
        content: input,
      });

      // Trigger scroll to bottom
      setScrollToBottom(true);
    } catch (error) {
      toast.error("Failed to process request");
      console.error(error);
    } finally {
      // Set loading state back to false
      setIsLoading(false);
    }
  };

  // Add state for tracking all visible pages and observers
  const [pageObservers, setPageObservers] = useState<IntersectionObserver[]>(
    [],
  );
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);

  // Add state to track loading status of individual pages
  const [pageLoadingStates, setPageLoadingStates] = useState<
    Record<number, boolean>
  >({});

  // Helper function to set page loading state
  const setPageLoading = (pageNumber: number, isLoading: boolean) => {
    setPageLoadingStates((prev) => ({
      ...prev,
      [pageNumber]: isLoading,
    }));
  };

  // Render multiple pages for continuous scrolling
  const renderAllPages = () => {
    if (!numPages) return null;

    return Array.from(new Array(numPages), (_, index) => {
      const pageNumber = index + 1;

      return (
        <div
          key={`page-container-${pageNumber}`}
          ref={(el) => {
            if (el) {
              pagesRef.current[index] = el;
              // Ensure data attribute is set explicitly
              el.setAttribute("data-page-number", String(pageNumber));
            }
            return undefined;
          }}
          data-page-number={pageNumber}
          className="mb-8 w-full"
          id={`pdf-page-${pageNumber}`}
        >
          {/* Loading indicator overlay */}
          {pageLoadingStates[pageNumber] && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
              <Icons.spinner className="my-24 size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="relative">
            <Page
              className="max-w-full border-b"
              width={calculatePageWidth()}
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              key={`page-${pageNumber}`}
              loading={() => {
                // Set loading state when page starts loading
                setPageLoading(pageNumber, true);
                return (
                  <div className="flex h-96 items-center justify-center">
                    <Icons.spinner className="my-24 size-6 animate-spin text-muted-foreground" />
                  </div>
                );
              }}
              error={() => {
                // Clear loading state on error
                setPageLoading(pageNumber, false);
                return (
                  <div className="flex h-48 items-center justify-center">
                    <p className="text-destructive">Failed to load page</p>
                  </div>
                );
              }}
              onRenderSuccess={() => {
                // Clear loading state on successful render
                setPageLoading(pageNumber, false);
              }}
            />
          </div>
        </div>
      );
    });
  };

  // Reset loading states when scale or rotation changes
  useEffect(() => {
    if (numPages) {
      const newStates: Record<number, boolean> = {};
      for (let i = 1; i <= numPages; i++) {
        newStates[i] = true;
      }
      setPageLoadingStates(newStates);
    }
  }, [scale, rotation, numPages]);

  return (
    <div
      className={cn(
        "mx-0 flex w-full flex-col items-center overflow-hidden rounded-md border bg-background",
        className,
      )}
    >
      <div className="flex h-14 w-full items-center justify-between border-b px-2">
        <div className="flex items-center gap-1.5">
          <Button
            disabled={currPage <= 1}
            onClick={() => {
              if (currPage > 1) goToPage(currPage - 1);
            }}
            variant="ghost"
            aria-label="previous page"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            <Input
              autoComplete="off"
              {...register("page")}
              className={cn(
                "h-8 w-12",
                errors.page && "focus-visible:ring-destructive",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(handlePageSubmit)();
                }
              }}
            />
            <p className="space-x-1 text-sm text-muted-foreground">
              <span>/</span>
              <span>{numPages ?? "x"}</span>
            </p>
          </div>

          <Button
            disabled={numPages === undefined || currPage === numPages}
            onClick={() => {
              if (currPage < (numPages || 1)) goToPage(currPage + 1);
            }}
            variant="ghost"
            aria-label="next page"
          >
            <ChevronUp className="size-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5" aria-label="zoom" variant="ghost">
                <Search className="h-4 w-4" />
                {scale * 100}%
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setScale(1)}>
                100%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(1.5)}>
                150%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2)}>
                200%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2.5)}>
                250%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setRotation((prev) => prev + 90)}
            variant="ghost"
            aria-label="rotate 90 degrees"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-9rem)] w-full overflow-scroll">
        <div
          ref={ref}
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          className="relative flex w-full justify-center"
        >
          <div ref={documentRef} className="max-w-full">
            <Document
              loading={() => (
                <div className="flex justify-center">
                  <Icons.spinner className="my-24 size-6 animate-spin text-muted-foreground" />
                </div>
              )}
              onLoadError={() => {
                toast.error("Error loading PDF");
              }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              file={url}
              className="pdf-document max-w-full"
              options={documentOptions}
            >
              {resizing ? (
                <div className="flex h-96 items-center justify-center">
                  <Icons.spinner className="my-24 size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderAllPages()
              )}
            </Document>

            {/* Text selection popup */}
            {showPopup && (
              <div
                className="absolute z-50 flex flex-row gap-1 rounded-md border bg-background p-1 shadow-md"
                style={{
                  left: `${popupPosition.x}px`,
                  top: `${popupPosition.y}px`,
                  transform: "translateX(-50%)",
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-sm"
                  onClick={() => handleAction("Explain: ")}
                >
                  <HelpCircle className="mr-1 size-3" />
                  Explain
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-sm"
                  onClick={() => handleAction("")}
                >
                  <Sparkles className="mr-1 size-3" />
                  Ask AI
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
