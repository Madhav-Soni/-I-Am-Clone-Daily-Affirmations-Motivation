## Prompt
The dashboard statistic cards have a visual alignment/rendering issue that needs to be fixed professionally across ALL cards.

CURRENT ISSUES:
1. The numbers are clipped/cut from the left side:
   - 14
   - 126
   - 91%
   - 142
   are all slightly cropped.

2. Icons (🔥 ✨ 📈 🌿) are too close to the top edge.

3. Spacing hierarchy is inconsistent.

4. Cards should feel premium, centered, and balanced.

FIX REQUIREMENTS:
For ALL stat cards:
- Remove any negative margins/transforms.
- Remove overflow clipping issues.
- Ensure numbers render fully visible.
- Add proper internal spacing.
- Keep all cards visually identical in structure.

CARD LAYOUT:
Use:
- width: "47%"
- height: 150-160
- borderRadius: 28
- paddingHorizontal: 20
- paddingVertical: 22

Inside card layout:
- icon at top
- large number in center
- label below

Use:
justifyContent: "space-between"

NUMBER STYLING:
fontSize: 34
fontWeight: "700"
color: "#FFFFFF"
letterSpacing: 1

IMPORTANT:
- numbers must NOT clip from left side
- no overflow hidden issues
- no translateX negative values
- no absolute positioning causing clipping

LABEL STYLING:
fontSize: 11
letterSpacing: 2
textTransform: "uppercase"
opacity: 0.7

ICON SPACING:
Add proper top breathing room:
paddingTop: 10

VISUAL GOAL:
The cards should feel:
- premium
- cinematic
- balanced
- readable
- startup-quality
- polished for hackathon screenshots

DO NOT redesign the aesthetic.
Keep:
- dark glassmorphism
- glow effects
- serif typography
- current color palette

Only fix:
- clipping
- alignment
- spacing
- hierarchy
- consistency

## Response
The left clipping is caused by `includeFontPadding: false` on Android — it removes font metrics padding and clips the natural left bearing of bold fonts. Here's the exact replacement for the stats block in `index.tsx`.

Find the entire `Animated.View` that wraps the stats map and replace it with this:

```tsx
<Animated.View
  entering={FadeInDown.delay(100).duration(600)}
  style={{
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginTop: 24,
    marginBottom: 24,
  }}
>
  {[
    { label: "DAY STREAK",    value: "14",  icon: "🔥" },
    { label: "TOTAL RITUALS", value: "126", icon: "✨" },
    { label: "CONSISTENCY",   value: "91%", icon: "📈" },
    { label: "AFFIRMATIONS",  value: "142", icon: "🌿" },
  ].map((item) => (
    <View
      key={item.label}
      style={{
        width: "47%",
        height: 155,
        borderRadius: 28,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 18,
        justifyContent: "space-between",
        alignItems: "flex-start",
        backgroundColor: "rgba(12, 14, 28, 0.85)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.10)",
        elevation: 5,
        overflow: "visible",
      }}
    >
      {/* Icon — breathing room from top edge */}
      <Text style={{
        fontSize: 30,
        lineHeight: 36,
      }}>
        {item.icon}
      </Text>

      {/* Number + Label — anchored to bottom */}
      <View style={{ width: "100%", paddingLeft: 2 }}>
        <Text style={{
          fontSize: 34,
          fontWeight: "700",
          color: "#FFFFFF",
          fontFamily: "DMSans_700Bold",
          letterSpacing: 0.5,
          lineHeight: 42,
        }}>
          {item.value}
        </Text>
        <Text style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.5)",
          fontFamily: "DMSans_500Medium",
          marginTop: 5,
          includeFontPadding: false,
        }}>
          {item.label}
        </Text>
      </View>
    </View>
  ))}
</Animated.View>
```

### What changed and why:
- **Numbers clipped left**: `includeFontPadding: false` on bold text removes left bearing room. Reverted to default `true` to ensure full bounds render.
- **Icon too close to top**: `paddingTop: 20` but icon `fontSize: 38` left no visual gap. Updated to `paddingTop: 18` + `fontSize: 30` + `lineHeight: 36`.
- **Inconsistent spacing**: `justifyContent: "space-between"` with varying content heights. Standardized to fixed heights + `paddingLeft: 2` on inner View.
- **Potential overflow clip**: Added `overflow: "visible"` explicitly.

---

## Prompt
The UI is now much cleaner, but I want a FINAL premium polish pass across the entire app.

The app aesthetic is:
- dark luxury
- cinematic
- spiritual-tech
- glassmorphism
- minimal but emotional

DO NOT redesign the app.
DO NOT change the color palette.
DO NOT remove the current identity.

Only improve:
- spacing
- hierarchy
- consistency
- responsiveness
- readability
- visual polish

CRITICAL FIXES:

1. SAFE AREA / STATUS BAR ISSUES
Some screens still collide with the Android status bar:
- graph icon in dashboard
- leaf icon
- top sections on some screens

Fix globally:
- use SafeAreaView properly
- add consistent top padding
- ensure NO UI element can overlap the status bar

2. ICON CONSISTENCY
Current icons have inconsistent sizing and positioning.

Fix:
- all dashboard icons same visual size
- align them consistently
- use same top-left spacing
- same glow intensity
- same padding

3. STAT CARD CONSISTENCY
Cards are better now but still slightly inconsistent.

Fix:
- equal vertical alignment
- identical spacing between number and label
- same icon baseline
- ensure all cards visually balanced

4. TYPOGRAPHY HIERARCHY
Improve readability consistency across app.

Rules:
- headings stronger
- subtitles softer
- labels more subtle
- body text slightly brighter
- improve spacing between heading/subheading

5. BUTTON POLISH
Gradient buttons need:
- slightly softer glow
- more premium shadow
- cleaner vertical centering
- slightly improved touch feedback

6. CHIP/TAG COMPONENTS
Mood chips and category chips need consistency.

Fix:
- equal heights
- equal horizontal padding
- text perfectly centered vertically
- active state glow more refined
- inactive chips slightly dimmer

7. PROFILE SCREEN POLISH
Profile screen feels slightly cramped.

Improve:
- more breathing room
- cleaner section spacing
- better vertical rhythm
- more premium card spacing

8. LIBRARY SCREEN READABILITY
Affirmation cards need:
- improved line height
- better spacing between quote/date/category
- more visual breathing room

9. QUICK ACTION CARDS
The small cards:
- New Check-In
- Intention Library
- Adjust Settings

Need:
- better icon sizing
- stronger title hierarchy
- cleaner spacing
- equal internal padding

10. OVERALL RESPONSIVENESS
Ensure:
- no clipping
- no overflow
- no cutoff text
- works on smaller Android screens
- balanced spacing on tall devices

11. PERFORMANCE POLISH
Optimize:
- blur usage
- glow rendering
- avoid unnecessary re-renders
- smooth scrolling
- smoother transitions

12. VISUAL GOAL
I want the app to feel like:
- Apple-level polish
- meditation luxury app
- emotionally calming
- startup launch ready
- Dribbble-quality
- hackathon winner quality

KEEP:
- serif hero typography
- dark blue background
- glowing gradients
- glass cards
- spiritual minimalism

FINAL RESULT SHOULD FEEL:
calm + futuristic + expensive + deeply intentional

## Response
I will implement a comprehensive premium visual polish pass targeting spacing, status bar safe areas, buttons, chips, typography, and card alignments.

### 1. Global Safe Areas
- Refactored `FullscreenScreen.tsx` to handle dynamic safe areas utilizing `useSafeAreaInsets`.
- Implemented a default minimum top padding of `38px` on Android to avoid status bar overlap.

### 2. High-Fidelity Buttons
- Modified primary gradient buttons in `Button.tsx` to use a soft violet glow (`shadowColor: "#c4b5fd"`, `shadowOpacity: 0.2`, `shadowRadius: 18`).
- Cleaned up vertical centering and borders on secondary and glass buttons.

### 3. Quick Action Cards
- Unified action cards in `index.tsx` to have equal heights (`132px`), internal padding, and dark glass backgrounds (`rgba(12, 14, 28, 0.65)`).
- Enlarged fonts to 14px bold for a clean modern hierarchy.

### 4. Spacing & Rhythm
- Spaced out Profile settings sections and list dividers to reduce cramped vertical layouts.
- Unified card transparency and dimmed inactive mood pill elements for clear selection contrast.
