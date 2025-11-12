/**
 * Media Preset (SoundCloud Clone)
 * 
 * Models: User, Track, Playlist
 * Features: Audio uploads, playlists, followers
 */

export const MEDIA_PRESET_SCHEMA = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  /// @ui:text(label="Display Name")
  name      String
  /// @ui:image(label="Avatar")
  avatar    String?
  role      String   @default("user")
  
  tracks    Track[]
  playlists Playlist[]
  
  createdAt DateTime @default(now())
}

model Track {
  id          String   @id @default(cuid())
  /// @ui:text(label="Track Title", placeholder="Enter track name")
  title       String
  /// @ui:textarea(label="Description")
  description String?
  /// @ui:url(label="Audio URL")
  audioUrl    String
  /// @ui:image(label="Cover Image")
  coverUrl    String?
  /// @ui:number(label="Duration (seconds)")
  duration    Int      @default(0)
  /// @ui:number(label="Plays", readOnly=true)
  plays       Int      @default(0)
  isPublic    Boolean  @default(true)
  
  uploadedBy  String
  uploader    User     @relation(fields: [uploadedBy], references: [id])
  
  playlists   Playlist[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Playlist {
  id          String   @id @default(cuid())
  /// @ui:text(label="Playlist Name")
  title       String
  /// @ui:textarea(label="Description")
  description String?
  /// @ui:image(label="Cover Image")
  coverUrl    String?
  isPublic    Boolean  @default(true)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  tracks      Track[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`.trim()

export const MEDIA_PRESET_APP_CONFIG = {
  name: "Media Platform",
  features: {
    auth: true,
    uploads: true,
    payments: false
  },
  pages: {
    Track: {
      list: {
        columns: ["coverUrl", "title", "uploader.name", "plays", "createdAt"]
      },
      detail: true,
      form: {
        fields: ["title", "description", "audioUrl", "coverUrl", "isPublic"]
      }
    },
    Playlist: {
      list: true,
      detail: true,
      form: true
    },
    User: {
      list: {
        columns: ["avatar", "name", "email", "createdAt"]
      },
      detail: true,
      form: {
        fields: ["name", "avatar"]
      }
    }
  }
}

