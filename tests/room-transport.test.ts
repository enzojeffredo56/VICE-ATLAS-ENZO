import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalRoomTransport, RoomError } from "@/lib/roulette/room-transport";
import { isAllowedVideoUrl, videoEmbed, videoUrlSchema } from "@/lib/video";

afterEach(() => window.localStorage.clear());

describe("salon en mode démo", () => {
  it("synchronise un tirage entre deux onglets du même appareil", async () => {
    const a = new LocalRoomTransport("ABC234");
    const b = new LocalRoomTransport("ABC234");
    const seen = vi.fn();
    b.subscribe(seen);
    await a.join();
    await b.join();
    await a.spin({ difficulty: "difficile", categories: [] });
    await vi.waitFor(() => expect(seen).toHaveBeenCalledWith(expect.objectContaining({ spins: [expect.objectContaining({ challenge: expect.objectContaining({ difficulty: "difficile" }) })] })));
    await a.leave();
    await b.leave();
  });

  it("limite à un tirage toutes les 4 secondes", async () => {
    const a = new LocalRoomTransport("XYZ789");
    await a.join();
    await a.spin({ difficulty: null, categories: [] });
    await expect(a.spin({ difficulty: null, categories: [] })).rejects.toBeInstanceOf(RoomError);
    await a.leave();
  });

  it("utilise les défis personnalisés du salon", async () => {
    const a = new LocalRoomTransport("PQR456");
    await a.join();
    await a.propose({ title: "Faire tout le trajet en marche arrière", category: "photo", difficulty: "facile" });
    const snap = await a.join();
    expect(snap.customChallenges).toHaveLength(1);
    await a.leave();
  });

  it("respecte les catégories demandées", async () => {
    const a = new LocalRoomTransport("STU567");
    const seen = vi.fn();
    a.subscribe(seen);
    await a.join();
    await a.spin({ difficulty: null, categories: ["photo"] });
    expect(seen.mock.calls.at(-1)?.[0].spins[0].challenge.category).toBe("photo");
    await a.leave();
  });
});

describe("liens vidéo", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", true],
    ["https://youtu.be/dQw4w9WgXcQ?t=5", true],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", true],
    ["https://clips.twitch.tv/SuperCascade-x1", true],
    ["https://streamable.com/abc123", true],
    ["http://youtu.be/dQw4w9WgXcQ", false],
    ["https://youtube.com.pirate.fr/watch?v=dQw4w9WgXcQ", false],
    ["https://exemple.com/video.mp4", false],
    ["javascript:alert(1)", false],
  ])("%s → %s", (url, ok) => {
    expect(isAllowedVideoUrl(url)).toBe(ok);
    expect(videoUrlSchema.safeParse(url).success).toBe(ok);
  });

  it("prépare un lecteur YouTube sans cookies", () => {
    expect(videoEmbed("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({ provider: "youtube", id: "dQw4w9WgXcQ", embedUrl: expect.stringContaining("youtube-nocookie.com/embed/dQw4w9WgXcQ") });
    expect(videoEmbed("https://exemple.com/x")).toBeNull();
  });
});
