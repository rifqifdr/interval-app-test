import { io, Layout, Page } from "@interval/sdk";
import { requireSpotifyPageAuth } from "../../auth";
import spotifyApi from "../../spotify";
import { getRelativeDateString } from "../../util";

export default new Page({
  name: "Spotify",
  description: "",
  handler: async () => {
    const maybeAuth = await requireSpotifyPageAuth();

    if (maybeAuth) {
      return maybeAuth;
    }

    const [topArtists, topTracks, myProfile, liked] = await Promise.all([
      spotifyApi.getMyTopArtists({ limit: 1, time_range: "medium_term" }),
      spotifyApi.getMyTopTracks({ limit: 1, time_range: "medium_term" }),
      spotifyApi.getMe(),
      spotifyApi.getMySavedTracks({
        limit: 50,
      }),
    ]);

    return new Layout({
      title: "🎧 Dan's Spotify",
      children: [
        io.display.metadata("", {
          layout: "card",
          data: [
            {
              label: "Top track",
              value: topTracks.body.items[0].name,
              url: topTracks.body.items[0].uri,
            },
            {
              label: "Top artist",
              value: topArtists.body.items[0].name,
              // url: topArtists.body.items[0].uri,
              route: "spotify/artist",
              params: { artistId: topArtists.body.items[0].id },
            },
            {
              label: "Followers",
              value: myProfile.body.followers.total,
            },
          ],
        }),
        io.display.heading("Recent likes", {
          menuItems: [
            {
              label: "Create playlist",
              route: "spotify/monthlyLikesPlaylist",
            },
          ],
        }),
        io.display.table("", {
          data: liked.body.items,
          columns: [
            {
              label: "Image",
              renderCell: (row) => ({
                image: {
                  url: row.track.album.images[0].url,
                  width: "thumbnail",
                },
              }),
            },
            {
              label: "Title",
              renderCell: (row) => row.track.name,
            },
            {
              label: "Artist",
              renderCell: (row) =>
                row.track.artists.map((a) => a.name).join(", "),
            },
            {
              label: "Date added",
              renderCell: (row) =>
                getRelativeDateString(new Date(row.added_at)),
            },
          ],
          rowMenuItems: (row) => [
            {
              label: "Listen on Spotify",
              url: row.track.uri,
            },
            {
              label: "Analyze track",
              route: "spotify/analyzeTrack",
              params: { trackId: row.track.id },
            },
            ...row.track.artists.map((a) => ({
              label: `View ${a.name}`,
              route: "spotify/artist",
              params: { artistId: a.id },
            })),
          ],
        }),
      ],
    });
  },
});