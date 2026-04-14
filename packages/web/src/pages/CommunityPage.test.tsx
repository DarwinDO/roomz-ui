import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import CommunityPage from "./CommunityPage";

const usePostsMock = vi.fn();
const useTopPostsMock = vi.fn();
const usePostMock = vi.fn();
const useToggleLikeMock = vi.fn();
const useDeletePostMock = vi.fn();

vi.mock("framer-motion", async () => {
  const React = await import("react");

  const motion = new Proxy(
    {},
    {
      get: (_target, key: string) =>
        React.forwardRef<HTMLElement, Record<string, unknown>>(({ children, ...props }, ref) => {
          const domProps = { ...props };

          delete domProps.animate;
          delete domProps.initial;
          delete domProps.variants;
          delete domProps.viewport;
          delete domProps.whileHover;
          delete domProps.whileInView;
          delete domProps.whileTap;

          return React.createElement(key, { ref, ...domProps }, children);
        }),
    },
  );

  return {
    motion,
    useReducedMotion: () => false,
  };
});

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: Record<string, unknown>) => (
    <div data-slot="avatar" {...props}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt = "", ...props }: Record<string, unknown>) =>
    src ? <img data-slot="avatar-image" src={String(src)} alt={String(alt)} {...props} /> : null,
  AvatarFallback: ({ children, ...props }: Record<string, unknown>) => (
    <span data-slot="avatar-fallback" {...props}>
      {children}
    </span>
  ),
}));

vi.mock("@/lib/motion", () => ({
  createPublicMotion: () => ({
    viewport: {},
    revealScale: () => ({}),
    stagger: () => ({}),
    hoverSoft: {},
    tap: {},
  }),
}));

vi.mock("@/hooks/useCommunity", () => ({
  usePosts: (...args: unknown[]) => usePostsMock(...args),
  useTopPosts: (...args: unknown[]) => useTopPostsMock(...args),
  usePost: (...args: unknown[]) => usePostMock(...args),
  useToggleLike: (...args: unknown[]) => useToggleLikeMock(...args),
  useDeletePost: (...args: unknown[]) => useDeletePostMock(...args),
}));

vi.mock("@/components/modals/CreatePostModal", () => ({
  CreatePostModal: () => null,
}));

vi.mock("@/components/modals/PostDetailModal", () => ({
  PostDetailModal: () => null,
}));

vi.mock("@/components/common/StitchFooter", () => ({
  StitchFooter: () => null,
}));

function buildPost(index: number) {
  return {
    id: `post-${index}`,
    user_id: `user-${index}`,
    type: index % 3 === 0 ? "offer" : "story",
    title: `Bài viết số ${index}`,
    content: `Nội dung bài viết số ${index}`,
    images: [`https://cdn.roomz.vn/post-${index}.jpg`],
    likes_count: index,
    comments_count: index % 4,
    status: "active",
    created_at: `2026-04-13T${String(index % 10).padStart(2, "0")}:00:00.000Z`,
    updated_at: `2026-04-13T${String(index % 10).padStart(2, "0")}:00:00.000Z`,
    author: {
      id: `user-${index}`,
      name: index === 1 ? "Lan Pham" : `Tac gia ${index}`,
      role: index % 2 === 0 ? "landlord" : "student",
      avatar: `https://cdn.roomz.vn/author-${index}.jpg`,
      verified: index % 2 === 0,
      isPremium: index <= 2,
    },
    liked: false,
  };
}

describe("CommunityPage", () => {
  beforeEach(() => {
    const pageOnePosts = Array.from({ length: 10 }, (_, index) => buildPost(index + 1));
    const pageTwoPosts = Array.from({ length: 2 }, (_, index) => buildPost(index + 11));
    let renderedPosts = pageOnePosts;
    let hasNextPage = true;
    const fetchNextPageMock = vi.fn(() => {
      renderedPosts = [...pageOnePosts, ...pageTwoPosts];
      hasNextPage = false;
    });

    usePostsMock.mockImplementation(() => ({
      posts: renderedPosts,
      totalCount: 12,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage,
      fetchNextPage: fetchNextPageMock,
    }));

    useTopPostsMock.mockReturnValue({
      data: [
        {
          ...buildPost(101),
          title: "Contributor post",
          author: {
            id: "top-user-1",
            name: "Minh Tran",
            role: "landlord",
            avatar: "https://cdn.roomz.vn/minh-tran.jpg",
            verified: false,
            isPremium: true,
          },
        },
      ],
    });

    usePostMock.mockReturnValue({ data: null });
    useToggleLikeMock.mockReturnValue({ mutate: vi.fn() });
    useDeletePostMock.mockReturnValue({ mutate: vi.fn() });
  });

  test("renders feed and contributor avatars from author data instead of static stitch assets", () => {
    const { container } = render(<CommunityPage />);

    expect(screen.getByText("Tin đăng cộng đồng")).toBeInTheDocument();
    expect(container.querySelector('img[src="https://cdn.roomz.vn/author-1.jpg"]')).toBeInTheDocument();
    expect(container.querySelector('img[src="https://cdn.roomz.vn/minh-tran.jpg"]')).toBeInTheDocument();
    expect(screen.getAllByLabelText("Rommz+ Premium").length).toBeGreaterThan(0);
  });

  test("renders a vertical social feed and loads ten more posts on demand", () => {
    const { rerender } = render(<CommunityPage />);

    expect(screen.getByLabelText("Danh sách tin đăng cộng đồng")).toHaveClass("space-y-6");
    expect(screen.getByText("Mỗi lượt tải 10 bài")).toBeInTheDocument();
    expect(screen.getByText("Bài viết số 1")).toBeInTheDocument();
    expect(screen.queryByText("Bài viết số 11")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Xem thêm bài viết" }));

    expect(usePostsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pageSize: 10,
      }),
    );

    rerender(<CommunityPage />);

    expect(screen.getByText("Bài viết số 11")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xem thêm bài viết" })).not.toBeInTheDocument();
  });
});
