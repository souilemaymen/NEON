# 🌌 Neon Air Draw — AI Spatial Interface

A high-performance, real-time web application for drawing in the air, using advanced hand tracking. Inspired by *Minority Report*: draw in the air with your dominant hand, and modify your creations with your other hand using intuitive gestures (move, scale, rotate).

## ✨ Key Features

- **✋ Dual‑hand interaction**:
  - **Right hand (dominant)**: precise drawing, selective erasing, full canvas clearing.
  - **Left hand (secondary)**: transform existing strokes (move, scale, rotate).
- **📐 Non‑destructive transforms**: strokes keep their original coordinates. All modifications (position, size, rotation) are applied at render time via matrix‑based math.
- **🕶️ Minimalist glassmorphism UI**: modern, clean design with real‑time HUD and visual guides.
- **⚡ High performance**: WebGL rendering engine optimized for smooth 60 FPS.
- **🌀 Physics‑based interaction**: smooth inertia when moving strokes, and snap‑to‑angle (45°) for rotation.
- **📖 Gesture guide**: built‑in interactive manual explaining every movement.

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Hand tracking**: @mediapipe/hands
- **Animations**: Framer Motion
- **Icons**: Lucide React (with inline SVG fallbacks for some icons)
- **Styling**: Vanilla CSS (glassmorphism & neon effects)

## 🎮 Gesture Guide

### ✍️ Drawing Hand (Right Hand)

| Gesture | Action |
|---|---|
| ☝️ **Index up** | Start drawing a stroke |
| 🤏 **Pinch** | Selective eraser (where the fingertip passes) |
| ✊ **Fist** | Clear the entire canvas |

### 🖐️ Control Hand (Left Hand)

| Gesture | Action | Visual Feedback |
|---|---|---|
| ✌️ **Two fingers up** | **Move** the nearest stroke | Blue crosshair + glow |
| 🤏 **Pinch & spread** | **Scale** the stroke | Concentric rings + percentage |
| 🖐️ **Open palm** | **Rotate** the stroke | Orange arc + snap points |

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
# 🌌 Neon Air Draw — Interface Spatiale à Intelligence Artificielle

Une application web de dessin dans l'air, rapide et temps réel, qui utilise le suivi avancé des mains. Inspirée du film *Minority Report* : dessinez dans l’air avec votre main dominante, et modifiez vos créations avec l’autre main grâce à des gestes intuitifs (déplacer, redimensionner, pivoter).

## ✨ Fonctionnalités principales

- **✋ Interaction avec les deux mains** :
  - **Main droite (dominante)** : dessin précis, effacement sélectif, nettoyage complet du canvas.
  - **Main gauche (secondaire)** : transformation des traits existants (déplacer, mettre à l’échelle, pivoter).
- **📐 Transformations non destructives** : les traits gardent leurs coordonnées d’origine. Les modifications (position, taille, rotation) sont appliquées à l’affichage avec des calculs mathématiques (matrices).
- **🕶️ Interface minimaliste « glassmorphism »** : design moderne et épuré, avec des informations en temps réel et des guides visuels.
- **⚡ Hautes performances** : moteur de rendu WebGL optimisé pour un affichage fluide à 60 images par seconde.
- **🌀 Interactions physiques** : inertie douce lors du déplacement des traits, et accrochage automatique à des angles tous les 45° pour la rotation.
- **📖 Guide des gestes** : un manuel interactif intégré qui explique chaque mouvement.

## 🛠️ Technologies utilisées

- **Frontend** : React + Vite
- **Suivi des mains** : @mediapipe/hands
- **Animations** : Framer Motion
- **Icônes** : Lucide React (avec des solutions de secours SVG pour certaines icônes)
- **Styles** : CSS pur (effet glassmorphism et néon)

## 🎮 Guide des gestes

### ✍️ Main qui dessine (main droite)

| Geste | Action |
|---|---|
| ☝️ **Index levé** | Commencer à tracer un trait |
| 🤏 **Pincement** | Effacement sélectif (là où passe le bout du doigt) |
| ✊ **Poing fermé** | Effacer tout le canvas |

### 🖐️ Main de contrôle (main gauche)

| Geste | Action | Retour visuel |
|---|---|---|
| ✌️ **Deux doigts levés** | **Déplacer** le trait le plus proche | Croix bleue + lueur |
| 🤏 **Pincer et écarter** | **Redimensionner** le trait | Cercles concentriques + pourcentage |
| 🖐️ **Main ouverte** | **Pivoter** le trait | Arc orange + points d’accrochage |

## 🚀 Comment démarrer

1. **Installer les dépendances** :
   ```bash
   npm install


