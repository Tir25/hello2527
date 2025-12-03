# 📊 Storage Capacity Analysis Report

**Generated:** December 2, 2025  
**Project:** He'loo Platform  
**Supabase Project:** ckuxuusctkmuwmeqnwxw

---

## 🗂️ Storage Buckets Configuration

### 1. **chat-media** Bucket
- **Status:** Public bucket
- **Per-file size limit:** 100 MB (104,857,600 bytes)
- **Purpose:** Chat media files (images, videos, audio, documents)
- **Current usage:** 9 files, ~9.68 MB total

### 2. **avatars** Bucket
- **Status:** Public bucket
- **Per-file size limit:** 5 MB (5,242,880 bytes)
- **Purpose:** User profile avatars
- **Current usage:** 3 files, ~420 KB total

---

## 📏 Application File Size Limits

Based on code configuration (`client/src/lib/constants/storage.ts`):

| File Type | Max Size (Application) | Max Size (Bucket) | Notes |
|-----------|------------------------|-------------------|-------|
| **Images** | 10 MB | 100 MB | Compressed to ~1 MB after upload |
| **Videos** | 15 MB | 100 MB | Largest files |
| **Documents** | 5 MB | 100 MB | PDF, Word, Excel, etc. |
| **Audio/Voice Clips** | 10 MB | 100 MB | Recorded audio messages |

---

## 📈 Current Storage Statistics

### chat-media Bucket Breakdown:
- **Total files:** 9
- **Total size:** ~9.68 MB
- **Images:** 3 files (avg ~119 KB each)
- **Videos:** 1 file (~8.98 MB)
- **Audio clips:** 3 files (avg ~98 KB each)
- **Documents:** 2 files (avg ~22 KB each)

### avatars Bucket:
- **Total files:** 3
- **Total size:** ~420 KB
- **All images:** 3 files

---

## 🧮 Theoretical Capacity Calculations

### Assumptions:
- **Supabase Free Tier:** 1 GB storage limit
- **Supabase Pro Tier:** 100 GB storage limit
- Using average file sizes from current usage
- Assuming worst-case scenario (largest allowed files)

### Scenario 1: Free Tier (1 GB = 1,024 MB)

#### Using Average File Sizes:
- **Images:** ~119 KB average → **~8,600 images**
- **Videos:** ~9 MB average → **~113 videos**
- **Audio clips:** ~98 KB average → **~10,400 voice clips**
- **Documents:** ~22 KB average → **~46,500 documents**

#### Using Maximum File Sizes:
- **Images:** 10 MB max → **~102 images**
- **Videos:** 15 MB max → **~68 videos**
- **Audio clips:** 10 MB max → **~102 voice clips**
- **Documents:** 5 MB max → **~204 documents**

#### Mixed Usage (Realistic Scenario):
Assuming a typical chat app distribution:
- 60% images (compressed to ~1 MB)
- 20% videos (~9 MB average)
- 15% audio clips (~98 KB average)
- 5% documents (~22 KB average)

**Capacity:** ~1,000 images + ~22 videos + ~1,500 audio clips + ~2,300 documents

### Scenario 2: Pro Tier (100 GB = 102,400 MB)

#### Using Maximum File Sizes:
- **Images:** 10 MB max → **~10,240 images**
- **Videos:** 15 MB max → **~6,826 videos**
- **Audio clips:** 10 MB max → **~10,240 voice clips**
- **Documents:** 5 MB max → **~20,480 documents**

#### Mixed Usage (Realistic Scenario):
**Capacity:** ~100,000 images + ~2,200 videos + ~150,000 audio clips + ~230,000 documents

---

## ⚠️ Important Constraints

### 1. **Per-File Limits**
- Application enforces stricter limits than bucket limits
- Videos capped at 15 MB (even though bucket allows 100 MB)
- Images compressed automatically to ~1 MB

### 2. **Storage Quota**
- Actual capacity depends on Supabase plan
- Free tier: 1 GB total storage
- Pro tier: 100 GB total storage
- Enterprise: Custom limits

### 3. **Auto-Cleanup Policy**
- **Videos:** Auto-deleted after 24 hours
- **Other media:** Auto-deleted after 30 days
- This prevents unlimited accumulation

### 4. **File Count Limits**
- No explicit file count limit in code
- Limited only by total storage quota
- Each file requires database record in `messages` table

---

## 📊 Practical Capacity Estimates

### For Free Tier (1 GB):

**Conservative Estimate (using max sizes):**
- **Images:** ~100 images
- **Videos:** ~65 videos (but auto-deleted after 24h)
- **Audio clips:** ~100 voice clips
- **Documents:** ~200 documents

**Realistic Estimate (mixed usage):**
- **Images:** ~800-1,000 images
- **Videos:** ~20-25 videos (rotating every 24h)
- **Audio clips:** ~1,200-1,500 voice clips
- **Documents:** ~2,000-2,500 documents

### For Pro Tier (100 GB):

**Conservative Estimate (using max sizes):**
- **Images:** ~10,000 images
- **Videos:** ~6,500 videos (but auto-deleted after 24h)
- **Audio clips:** ~10,000 voice clips
- **Documents:** ~20,000 documents

**Realistic Estimate (mixed usage):**
- **Images:** ~80,000-100,000 images
- **Videos:** ~2,000-2,500 videos (rotating every 24h)
- **Audio clips:** ~120,000-150,000 voice clips
- **Documents:** ~200,000-250,000 documents

---

## 🔄 Auto-Cleanup Impact

The application has an automatic cleanup system:

1. **Videos:** Deleted after 24 hours
   - Prevents video storage from growing indefinitely
   - Videos are temporary by design

2. **Other Media:** Deleted after 30 days
   - Images, audio, documents persist for 30 days
   - After deletion, messages show "Media expired"

**Impact on Capacity:**
- Videos don't accumulate long-term
- Other media rotates monthly
- Effective capacity is higher due to cleanup

---

## 📝 Recommendations

1. **Monitor Storage Usage**
   - Check Supabase dashboard regularly
   - Set up alerts for storage quota warnings

2. **Optimize File Sizes**
   - Images are already compressed (good!)
   - Consider video compression for better capacity

3. **Consider Upgrade**
   - If approaching 1 GB limit, consider Pro tier
   - Pro tier offers 100x more storage

4. **Cleanup Frequency**
   - Current cleanup is appropriate for chat app
   - Videos (24h) prevent large file accumulation
   - 30-day retention for other media is reasonable

---

## 📋 Summary

**Current Status:**
- ✅ Storage properly configured
- ✅ File size limits enforced
- ✅ Auto-cleanup active
- ✅ Current usage: ~10 MB / 1 GB (Free tier) or 100 GB (Pro tier)

**Capacity (Free Tier - 1 GB):**
- **Images:** ~800-1,000 (with compression)
- **Videos:** ~20-25 (rotating every 24h)
- **Audio clips:** ~1,200-1,500
- **Documents:** ~2,000-2,500

**Capacity (Pro Tier - 100 GB):**
- **Images:** ~80,000-100,000 (with compression)
- **Videos:** ~2,000-2,500 (rotating every 24h)
- **Audio clips:** ~120,000-150,000
- **Documents:** ~200,000-250,000

---

*Note: Actual capacity may vary based on file sizes, compression ratios, and Supabase plan limits.*

