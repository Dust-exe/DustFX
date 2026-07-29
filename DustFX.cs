using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace DustFX
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    // --- CUSTOM OWNER-DRAWN MODERN SLIDER (EYE-FRIENDLY) ---
    public class CustomSlider : Control
    {
        private int minimum = 0;
        private int maximum = 100;
        private int val = 50;
        private bool isDragging = false;

        public event EventHandler ValueChanged;

        public int Minimum
        {
            get { return minimum; }
            set { minimum = value; Invalidate(); }
        }

        public int Maximum
        {
            get { return maximum; }
            set { maximum = value; Invalidate(); }
        }

        public int Value
        {
            get { return val; }
            set
            {
                int newval = Math.Max(minimum, Math.Min(maximum, value));
                if (val != newval)
                {
                    val = newval;
                    Invalidate();
                    if (ValueChanged != null) ValueChanged(this, EventArgs.Empty);
                }
            }
        }

        public Color TrackColor { get; set; }
        public Color FillStartColor { get; set; }
        public Color FillEndColor { get; set; }
        public Color ThumbColor { get; set; }

        public CustomSlider()
        {
            this.DoubleBuffered = true;
            this.Size = new Size(300, 24);
            this.Cursor = Cursors.Hand;
            this.TrackColor = Color.FromArgb(38, 30, 60);
            this.FillStartColor = Color.FromArgb(140, 122, 230); // Soft Lavender Blue
            this.FillEndColor = Color.FromArgb(224, 86, 253);   // Soft Pastel Orchid
            this.ThumbColor = Color.FromArgb(224, 86, 253);     // Pastel Pink/Orchid Glow
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            base.OnMouseDown(e);
            if (e.Button == MouseButtons.Left)
            {
                isDragging = true;
                UpdateValueFromMouse(e.X);
            }
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            if (isDragging)
            {
                UpdateValueFromMouse(e.X);
            }
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            base.OnMouseUp(e);
            isDragging = false;
        }

        private void UpdateValueFromMouse(int mouseX)
        {
            int padding = 10;
            int trackWidth = this.Width - (padding * 2);
            if (trackWidth <= 0) return;

            int clampedX = Math.Max(padding, Math.Min(this.Width - padding, mouseX));
            double ratio = (double)(clampedX - padding) / trackWidth;
            int calculatedVal = minimum + (int)Math.Round(ratio * (maximum - minimum));
            this.Value = calculatedVal;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.Clear(this.Parent != null ? this.Parent.BackColor : Color.FromArgb(24, 19, 41));

            int padding = 10;
            int trackHeight = 6;
            int trackY = (this.Height - trackHeight) / 2;
            int trackWidth = this.Width - (padding * 2);

            // Track Background
            using (GraphicsPath trackPath = GetRoundedRectPath(new Rectangle(padding, trackY, trackWidth, trackHeight), trackHeight))
            using (SolidBrush trackBrush = new SolidBrush(TrackColor))
            {
                g.FillPath(trackBrush, trackPath);
            }

            // Track Fill
            double ratio = (maximum > minimum) ? (double)(val - minimum) / (maximum - minimum) : 0;
            int fillWidth = (int)(ratio * trackWidth);
            if (fillWidth > 0)
            {
                using (GraphicsPath fillPath = GetRoundedRectPath(new Rectangle(padding, trackY, fillWidth, trackHeight), trackHeight))
                using (LinearGradientBrush fillBrush = new LinearGradientBrush(
                    new Point(padding, 0), new Point(padding + fillWidth, 0),
                    FillStartColor, FillEndColor))
                {
                    g.FillPath(fillBrush, fillPath);
                }
            }

            // Thumb Pill
            int thumbRadius = 8;
            int thumbX = padding + (int)(ratio * trackWidth);
            int thumbY = this.Height / 2;

            Rectangle thumbRect = new Rectangle(thumbX - thumbRadius, thumbY - thumbRadius, thumbRadius * 2, thumbRadius * 2);

            using (SolidBrush glowBrush = new SolidBrush(Color.FromArgb(50, ThumbColor.R, ThumbColor.G, ThumbColor.B)))
            {
                g.FillEllipse(glowBrush, thumbX - thumbRadius - 3, thumbY - thumbRadius - 3, (thumbRadius + 3) * 2, (thumbRadius + 3) * 2);
            }

            using (SolidBrush thumbBrush = new SolidBrush(ThumbColor))
            {
                g.FillEllipse(thumbBrush, thumbRect);
            }
            using (Pen borderPen = new Pen(Color.White, 1.5f))
            {
                g.DrawEllipse(borderPen, thumbRect);
            }
        }

        private GraphicsPath GetRoundedRectPath(Rectangle rect, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            int diameter = radius;
            path.AddArc(rect.X, rect.Y, diameter, diameter, 180, 90);
            path.AddArc(rect.Right - diameter, rect.Y, diameter, diameter, 270, 90);
            path.AddArc(rect.Right - diameter, rect.Bottom - diameter, diameter, diameter, 0, 90);
            path.AddArc(rect.X, rect.Bottom - diameter, diameter, diameter, 90, 90);
            path.CloseFigure();
            return path;
        }
    }

    // --- CUSTOM OWNER-DRAWN BUTTON ---
    public class CustomButton : Button
    {
        private bool isHovered = false;
        private bool isPressed = false;

        public Color NormalColor { get; set; }
        public Color HoverColor { get; set; }
        public Color TextCustomColor { get; set; }
        public int BorderRadius { get; set; }

        public CustomButton()
        {
            this.DoubleBuffered = true;
            this.FlatStyle = FlatStyle.Flat;
            this.FlatAppearance.BorderSize = 0;
            this.Cursor = Cursors.Hand;
            this.NormalColor = Color.FromArgb(37, 27, 56);
            this.HoverColor = Color.FromArgb(224, 86, 253);
            this.TextCustomColor = Color.White;
            this.BorderRadius = 10;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
        }

        protected override void OnMouseEnter(EventArgs e)
        {
            base.OnMouseEnter(e);
            isHovered = true;
            Invalidate();
        }

        protected override void OnMouseLeave(EventArgs e)
        {
            base.OnMouseLeave(e);
            isHovered = false;
            Invalidate();
        }

        protected override void OnMouseDown(MouseEventArgs mevent)
        {
            base.OnMouseDown(mevent);
            isPressed = true;
            Invalidate();
        }

        protected override void OnMouseUp(MouseEventArgs mevent)
        {
            base.OnMouseUp(mevent);
            isPressed = false;
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs pevent)
        {
            Graphics g = pevent.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.Clear(this.Parent != null ? this.Parent.BackColor : Color.FromArgb(24, 19, 41));

            Rectangle rect = new Rectangle(0, 0, this.Width, this.Height);
            Color currentBg = isPressed ? Color.FromArgb(140, NormalColor) : (isHovered ? HoverColor : NormalColor);

            using (GraphicsPath path = GetRoundedRectPath(new Rectangle(1, 1, this.Width - 2, this.Height - 2), BorderRadius))
            {
                using (SolidBrush brush = new SolidBrush(currentBg))
                {
                    g.FillPath(brush, path);
                }

                if (isHovered)
                {
                    using (Pen glowPen = new Pen(Color.FromArgb(160, 255, 255, 255), 1.5f))
                    {
                        g.DrawPath(glowPen, path);
                    }
                }
                else
                {
                    using (Pen borderPen = new Pen(Color.FromArgb(25, 255, 255, 255), 1))
                    {
                        g.DrawPath(borderPen, path);
                    }
                }
            }

            TextRenderer.DrawText(g, this.Text, this.Font, rect, TextCustomColor, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
        }

        private GraphicsPath GetRoundedRectPath(Rectangle rect, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            int diameter = radius * 2;
            path.AddArc(rect.X, rect.Y, diameter, diameter, 180, 90);
            path.AddArc(rect.Right - diameter, rect.Y, diameter, diameter, 270, 90);
            path.AddArc(rect.Right - diameter, rect.Bottom - diameter, diameter, diameter, 0, 90);
            path.AddArc(rect.X, rect.Bottom - diameter, diameter, diameter, 90, 90);
            path.CloseFigure();
            return path;
        }
    }

    // --- SYSTEM TRAY MENU CUTE DARK THEME RENDERER ---
    public class CustomMenuRenderer : ToolStripProfessionalRenderer
    {
        public CustomMenuRenderer() : base(new CustomColorTable()) { }
    }

    public class CustomColorTable : ProfessionalColorTable
    {
        public override Color ToolStripDropDownBackground { get { return Color.FromArgb(22, 16, 36); } }
        public override Color ImageMarginGradientBegin { get { return Color.FromArgb(22, 16, 36); } }
        public override Color ImageMarginGradientMiddle { get { return Color.FromArgb(22, 16, 36); } }
        public override Color ImageMarginGradientEnd { get { return Color.FromArgb(22, 16, 36); } }
        public override Color MenuItemSelected { get { return Color.FromArgb(52, 38, 84); } }
        public override Color MenuItemBorder { get { return Color.FromArgb(224, 86, 253); } }
        public override Color MenuItemSelectedGradientBegin { get { return Color.FromArgb(52, 38, 84); } }
        public override Color MenuItemSelectedGradientEnd { get { return Color.FromArgb(52, 38, 84); } }
        public override Color MenuBorder { get { return Color.FromArgb(84, 56, 132); } }
        public override Color SeparatorDark { get { return Color.FromArgb(55, 42, 88); } }
    }

    // --- MAIN DUSTFX FORM ---
    public class MainForm : Form
    {
        // --- WINDOWS MAGNIFICATION API ---
        [DllImport("magnification.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern bool MagInitialize();

        [DllImport("magnification.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern bool MagUninitialize();

        [DllImport("magnification.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern bool MagSetFullscreenColorEffect(ref MAGCOLOREFFECT pEffect);

        [StructLayout(LayoutKind.Sequential)]
        public struct MAGCOLOREFFECT
        {
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 25)]
            public float[] transform;
        }

        // --- WIN32 HOTKEYS & DRAGGING ---
        [DllImport("user32.dll")]
        private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

        [DllImport("user32.dll")]
        private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

        [DllImport("user32.dll")]
        public static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);

        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int HT_CAPTION = 0x2;

        private const int HOTKEY_ID_MAX_GAMMA = 1001;
        private const int HOTKEY_ID_TOGGLE_VIBRANCE = 1002;
        private const int WM_HOTKEY = 0x0312;

        // Custom Eye-Friendly Theme Palette: Soft Pastel Magenta, Velvet Violet, Midnight Charcoal
        private Color colBg = Color.FromArgb(14, 11, 22);           // Midnight Velvet Black
        private Color colTitle = Color.FromArgb(20, 16, 32);       // Dark Title Header
        private Color colCard = Color.FromArgb(24, 19, 41);        // Soft Velvet Card Panel
        private Color colCardBorder = Color.FromArgb(52, 38, 82);   // Subtle Violet Border
        private Color colSoftMagenta = Color.FromArgb(224, 86, 253); // Soft Pastel Magenta (Eye-Friendly)
        private Color colLavenderPastel = Color.FromArgb(190, 170, 250);
        private Color colWarmCoral = Color.FromArgb(238, 82, 83);   // Soft Warm Coral Action
        private Color colButtonDark = Color.FromArgb(37, 27, 56);   // Dark Violet Button
        private Color colTextPrimary = Color.FromArgb(245, 246, 250);
        private Color colTextSecondary = Color.FromArgb(180, 172, 205);

        // Sliders
        private CustomSlider tbGamma;
        private CustomSlider tbVibrance;
        private CustomSlider tbBrightness;
        private CustomSlider tbContrast;
        private CustomSlider tbRed;
        private CustomSlider tbGreen;
        private CustomSlider tbBlue;

        // Labels
        private Label lblGammaVal;
        private Label lblVibranceVal;
        private Label lblBrightnessVal;
        private Label lblContrastVal;
        private Label lblRedVal;
        private Label lblGreenVal;
        private Label lblBlueVal;
        private Label lblStatusIndicator;

        // Buttons
        private CustomButton btnFullDccw;
        private CustomButton btnReset;
        private CustomButton btnBindGammaKey;
        private CustomButton btnBindVibranceKey;

        private CustomButton btnPresetNight;
        private CustomButton btnPresetCave;
        private CustomButton btnPresetPvp;
        private CustomButton btnPresetDay;

        // Hotkey & State
        private bool isMaxGammaActive = false;
        private bool isVibranceActive = false;
        private Keys hotkeyGamma = Keys.F8;
        private Keys hotkeyVibrance = Keys.F9;

        private bool isBindingGamma = false;
        private bool isBindingVibrance = false;

        private bool magEngineReady = false;
        private bool isExplicitExit = false;

        private NotifyIcon trayIcon;
        private Image portalLogoImg = null;
        private Icon appIcon = null;

        private string configFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "dustfx_config.txt");

        public MainForm()
        {
            this.Text = "DustFX";
            this.Size = new Size(860, 700);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = colBg;
            this.ForeColor = colTextPrimary;
            this.DoubleBuffered = true;

            LoadLogoAndIcon();
            LoadConfig();
            magEngineReady = MagInitialize();
            BuildFramelessTitleBar();
            BuildUIContent();
            RegisterGlobalHotkeys();
            CreateTrayIcon();

            this.FormClosing += MainForm_FormClosing;
        }

        private void LoadLogoAndIcon()
        {
            try
            {
                string logoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "logo.png");
                if (File.Exists(logoPath))
                {
                    using (Bitmap orig = new Bitmap(logoPath))
                    {
                        portalLogoImg = new Bitmap(orig);
                        IntPtr hIcon = orig.GetHicon();
                        appIcon = Icon.FromHandle(hIcon);
                        this.Icon = appIcon;
                    }
                }
            }
            catch { }
        }

        private void LoadConfig()
        {
            try
            {
                if (File.Exists(configFile))
                {
                    string[] lines = File.ReadAllLines(configFile);
                    foreach (string line in lines)
                    {
                        string[] parts = line.Split('=');
                        if (parts.Length == 2)
                        {
                            if (parts[0].Trim() == "HotkeyGamma")
                            {
                                hotkeyGamma = (Keys)Enum.Parse(typeof(Keys), parts[1].Trim());
                            }
                            else if (parts[0].Trim() == "HotkeyVibrance")
                            {
                                hotkeyVibrance = (Keys)Enum.Parse(typeof(Keys), parts[1].Trim());
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private void SaveConfig()
        {
            try
            {
                string content = string.Format("HotkeyGamma={0}\nHotkeyVibrance={1}", hotkeyGamma, hotkeyVibrance);
                File.WriteAllText(configFile, content);
            }
            catch { }
        }

        private void BuildFramelessTitleBar()
        {
            Panel titleBar = new Panel();
            titleBar.Size = new Size(this.Width, 48);
            titleBar.Location = new Point(0, 0);
            titleBar.BackColor = colTitle;

            titleBar.MouseDown += (s, e) =>
            {
                if (e.Button == MouseButtons.Left)
                {
                    ReleaseCapture();
                    SendMessage(this.Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                }
            };

            // Portal Pixel Logo PictureBox
            int logoX = 14;
            if (portalLogoImg != null)
            {
                PictureBox pbLogo = new PictureBox();
                pbLogo.Image = portalLogoImg;
                pbLogo.SizeMode = PictureBoxSizeMode.Zoom;
                pbLogo.Size = new Size(32, 32);
                pbLogo.Location = new Point(14, 8);
                pbLogo.BackColor = Color.Transparent;
                pbLogo.MouseDown += (s, e) =>
                {
                    if (e.Button == MouseButtons.Left)
                    {
                        ReleaseCapture();
                        SendMessage(this.Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                    }
                };
                titleBar.Controls.Add(pbLogo);
                logoX = 54;
            }

            // App Name
            Label lblAppIcon = new Label();
            lblAppIcon.Text = "DUSTFX";
            lblAppIcon.Font = new Font("Segoe UI", 12.5f, FontStyle.Bold);
            lblAppIcon.ForeColor = colSoftMagenta;
            lblAppIcon.AutoSize = true;
            lblAppIcon.Location = new Point(logoX, 11);
            lblAppIcon.MouseDown += (s, e) =>
            {
                if (e.Button == MouseButtons.Left)
                {
                    ReleaseCapture();
                    SendMessage(this.Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                }
            };
            titleBar.Controls.Add(lblAppIcon);

            // Close Button (Hides to System Tray)
            Button btnClose = new Button();
            btnClose.Text = "✕";
            btnClose.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            btnClose.ForeColor = colTextPrimary;
            btnClose.BackColor = Color.Transparent;
            btnClose.FlatStyle = FlatStyle.Flat;
            btnClose.FlatAppearance.BorderSize = 0;
            btnClose.Size = new Size(48, 48);
            btnClose.Location = new Point(this.Width - 48, 0);
            btnClose.Cursor = Cursors.Hand;
            btnClose.Click += (s, e) => HideToTray();
            btnClose.MouseEnter += (s, e) => btnClose.BackColor = colWarmCoral;
            btnClose.MouseLeave += (s, e) => btnClose.BackColor = Color.Transparent;
            titleBar.Controls.Add(btnClose);

            // Minimize Button
            Button btnMin = new Button();
            btnMin.Text = "─";
            btnMin.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            btnMin.ForeColor = colTextPrimary;
            btnMin.BackColor = Color.Transparent;
            btnMin.FlatStyle = FlatStyle.Flat;
            btnMin.FlatAppearance.BorderSize = 0;
            btnMin.Size = new Size(48, 48);
            btnMin.Location = new Point(this.Width - 96, 0);
            btnMin.Cursor = Cursors.Hand;
            btnMin.Click += (s, e) => this.WindowState = FormWindowState.Minimized;
            btnMin.MouseEnter += (s, e) => btnMin.BackColor = Color.FromArgb(45, 32, 68);
            btnMin.MouseLeave += (s, e) => btnMin.BackColor = Color.Transparent;
            titleBar.Controls.Add(btnMin);

            this.Controls.Add(titleBar);
        }

        private void BuildUIContent()
        {
            // Left Card: Filters & Controls
            Panel pnlLeft = CreateCardPanel(16, 62, 520, 618);
            int y = 16;

            AddHeader(pnlLeft, "EKRAN GÖRÜNTÜ & FİLTRE AYARLARI", ref y);

            // Gamma Slider
            lblGammaVal = AddCustomSliderRow(pnlLeft, "DCCW Gama Boost (Gece Görüşü):", 5, 40, 10, ref y, out tbGamma, v => string.Format("{0:0.0}x", v / 10.0));
            tbGamma.ValueChanged += (s, e) => ApplyHardwareColorMatrix();

            // Vibrance Slider
            lblVibranceVal = AddCustomSliderRow(pnlLeft, "Digital Vibrance (Canlılık):", 0, 100, 0, ref y, out tbVibrance, v => string.Format("%{0}", v));
            tbVibrance.ValueChanged += (s, e) => ApplyHardwareColorMatrix();

            // Brightness Slider
            lblBrightnessVal = AddCustomSliderRow(pnlLeft, "Parlaklık Ofset (Gölge Detay):", -50, 50, 0, ref y, out tbBrightness, v => string.Format("{0}%", v));
            tbBrightness.ValueChanged += (s, e) => ApplyHardwareColorMatrix();

            // Contrast Slider
            lblContrastVal = AddCustomSliderRow(pnlLeft, "Kontrast Keskinliği:", 5, 25, 10, ref y, out tbContrast, v => string.Format("{0:0.0}x", v / 10.0));
            tbContrast.ValueChanged += (s, e) => ApplyHardwareColorMatrix();

            AddHeader(pnlLeft, "RGB RENK KANALLARI (ÖZEL AYAR)", ref y);

            // Red
            lblRedVal = AddCustomSliderRow(pnlLeft, "Kırmızı Kanalı:", 5, 20, 10, ref y, out tbRed, v => string.Format("{0:0.0}x", v / 10.0));
            tbRed.ValueChanged += (s, e) => ApplyHardwareColorMatrix();

            // Green
            lblGreenVal = AddCustomSliderRow(pnlLeft, "Yeşil Kanalı:", 5, 20, 10, ref y, out tbGreen, v => string.Format("{0:0.0}x", v / 10.0));
            tbGreen.ValueChanged += (s, e) => ApplyHardwareColorMatrix();

            // Blue
            lblBlueVal = AddCustomSliderRow(pnlLeft, "Mavi Kanalı:", 5, 20, 10, ref y, out tbBlue, v => string.Format("{0:0.0}x", v / 10.0));
            tbBlue.ValueChanged += (s, e) => ApplyHardwareColorMatrix();

            // Status Indicator
            lblStatusIndicator = new Label();
            lblStatusIndicator.Text = "● EKRAN GÜNCEL (ANINDA CANLI UYGULANDI)";
            lblStatusIndicator.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
            lblStatusIndicator.ForeColor = colSoftMagenta;
            lblStatusIndicator.Location = new Point(20, y + 10);
            lblStatusIndicator.AutoSize = true;
            pnlLeft.Controls.Add(lblStatusIndicator);

            this.Controls.Add(pnlLeft);

            // Right Card: Actions & Hotkeys
            Panel pnlRight = CreateCardPanel(552, 62, 290, 618);
            int ry = 16;

            AddHeader(pnlRight, "ANLIK EYLEMLER", ref ry);

            // MAX DCCW BUTTON - SADECE GAMA FULLEME (WARM CORAL SOFTER COLOR)
            btnFullDccw = new CustomButton();
            btnFullDccw.Text = "🔥 MAX DCCW (SADECE GAMA)";
            btnFullDccw.NormalColor = colWarmCoral;
            btnFullDccw.HoverColor = Color.FromArgb(255, 110, 110);
            btnFullDccw.TextCustomColor = Color.White;
            btnFullDccw.Location = new Point(16, ry);
            btnFullDccw.Size = new Size(258, 48);
            btnFullDccw.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            btnFullDccw.Click += (s, e) => ToggleFullDccwOnly();
            pnlRight.Controls.Add(btnFullDccw);
            ry += 58;

            btnReset = new CustomButton();
            btnReset.Text = "🔄 OYUN İÇİ AYARLARI SIFIRLA";
            btnReset.NormalColor = colButtonDark;
            btnReset.HoverColor = Color.FromArgb(60, 45, 90);
            btnReset.TextCustomColor = colTextPrimary;
            btnReset.Location = new Point(16, ry);
            btnReset.Size = new Size(258, 40);
            btnReset.Click += (s, e) => ResetToDefault();
            pnlRight.Controls.Add(btnReset);
            ry += 52;

            AddHeader(pnlRight, "HAZIR EKRAN PROFİLLERİ", ref ry);

            btnPresetNight = CreatePresetBtn("🌙 Gece Görüşü Boost", 16, ry, (s, e) => LoadPreset(35, 100, 15, 13, 10, 10, 10));
            pnlRight.Controls.Add(btnPresetNight);
            ry += 44;

            btnPresetCave = CreatePresetBtn("🕳️ Mağara Parlatıcı Modu", 16, ry, (s, e) => LoadPreset(38, 80, 25, 12, 10, 10, 13));
            pnlRight.Controls.Add(btnPresetCave);
            ry += 44;

            btnPresetPvp = CreatePresetBtn("🎯 PVP Netlik & Kontrast", 16, ry, (s, e) => LoadPreset(16, 90, 5, 14, 11, 10, 9));
            pnlRight.Controls.Add(btnPresetPvp);
            ry += 44;

            btnPresetDay = CreatePresetBtn("☀️ Gündüz Canlılık Modu", 16, ry, (s, e) => LoadPreset(12, 60, 0, 11, 10, 10, 10));
            pnlRight.Controls.Add(btnPresetDay);
            ry += 52;

            AddHeader(pnlRight, "TUŞ ATAMALARI (HOTKEYS)", ref ry);

            Label lblHk1 = new Label();
            lblHk1.Text = "Max Gama Tuşu:";
            lblHk1.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblHk1.ForeColor = colTextSecondary;
            lblHk1.Location = new Point(16, ry + 4);
            lblHk1.AutoSize = true;
            pnlRight.Controls.Add(lblHk1);

            btnBindGammaKey = new CustomButton();
            btnBindGammaKey.Text = hotkeyGamma.ToString() + " (Değiştir)";
            btnBindGammaKey.NormalColor = Color.FromArgb(140, 122, 230);
            btnBindGammaKey.HoverColor = colSoftMagenta;
            btnBindGammaKey.TextCustomColor = Color.White;
            btnBindGammaKey.Location = new Point(135, ry);
            btnBindGammaKey.Size = new Size(139, 30);
            btnBindGammaKey.Click += (s, e) => StartBindingGamma();
            pnlRight.Controls.Add(btnBindGammaKey);
            ry += 40;

            Label lblHk2 = new Label();
            lblHk2.Text = "Vibrance Tuşu:";
            lblHk2.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblHk2.ForeColor = colTextSecondary;
            lblHk2.Location = new Point(16, ry + 4);
            lblHk2.AutoSize = true;
            pnlRight.Controls.Add(lblHk2);

            btnBindVibranceKey = new CustomButton();
            btnBindVibranceKey.Text = hotkeyVibrance.ToString() + " (Değiştir)";
            btnBindVibranceKey.NormalColor = colSoftMagenta;
            btnBindVibranceKey.HoverColor = colLavenderPastel;
            btnBindVibranceKey.TextCustomColor = Color.White;
            btnBindVibranceKey.Location = new Point(135, ry);
            btnBindVibranceKey.Size = new Size(139, 30);
            btnBindVibranceKey.Click += (s, e) => StartBindingVibrance();
            pnlRight.Controls.Add(btnBindVibranceKey);

            this.Controls.Add(pnlRight);
        }

        private Panel CreateCardPanel(int x, int y, int width, int height)
        {
            Panel pnl = new Panel();
            pnl.Location = new Point(x, y);
            pnl.Size = new Size(width, height);
            pnl.BackColor = colCard;
            pnl.Paint += (s, e) =>
            {
                Graphics g = e.Graphics;
                g.SmoothingMode = SmoothingMode.AntiAlias;
                Rectangle rect = new Rectangle(0, 0, pnl.Width - 1, pnl.Height - 1);
                using (GraphicsPath path = GetRoundedRectPath(rect, 14))
                {
                    using (SolidBrush br = new SolidBrush(colCard))
                    {
                        g.FillPath(br, path);
                    }
                    using (Pen pen = new Pen(colCardBorder, 1.5f))
                    {
                        g.DrawPath(pen, path);
                    }
                }
            };
            return pnl;
        }

        private GraphicsPath GetRoundedRectPath(Rectangle rect, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            int diameter = radius * 2;
            path.AddArc(rect.X, rect.Y, diameter, diameter, 180, 90);
            path.AddArc(rect.Right - diameter, rect.Y, diameter, diameter, 270, 90);
            path.AddArc(rect.Right - diameter, rect.Bottom - diameter, diameter, diameter, 0, 90);
            path.AddArc(rect.X, rect.Bottom - diameter, diameter, diameter, 90, 90);
            path.CloseFigure();
            return path;
        }

        private void AddHeader(Panel parent, string title, ref int y)
        {
            Label lbl = new Label();
            lbl.Text = title;
            lbl.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lbl.ForeColor = colLavenderPastel;
            lbl.Location = new Point(16, y);
            lbl.AutoSize = true;
            parent.Controls.Add(lbl);
            y += 24;
        }

        private Label AddCustomSliderRow(Panel parent, string title, int min, int max, int val, ref int y, out CustomSlider slider, Func<int, string> formatter)
        {
            Label lblTitle = new Label();
            lblTitle.Text = title;
            lblTitle.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblTitle.ForeColor = colTextPrimary;
            lblTitle.Location = new Point(16, y);
            lblTitle.AutoSize = true;
            parent.Controls.Add(lblTitle);

            Label lblVal = new Label();
            lblVal.Text = formatter(val);
            lblVal.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
            lblVal.ForeColor = colSoftMagenta;
            lblVal.Location = new Point(430, y);
            lblVal.Size = new Size(70, 20);
            lblVal.TextAlign = ContentAlignment.TopRight;
            parent.Controls.Add(lblVal);

            y += 20;

            slider = new CustomSlider();
            slider.Minimum = min;
            slider.Maximum = max;
            slider.Value = val;
            slider.Location = new Point(16, y);
            slider.Size = new Size(485, 26);
            slider.FillStartColor = Color.FromArgb(140, 122, 230);
            slider.FillEndColor = colSoftMagenta;
            slider.ThumbColor = colSoftMagenta;

            CustomSlider sliderRef = slider;
            slider.ValueChanged += (s, e) =>
            {
                lblVal.Text = formatter(sliderRef.Value);
            };

            parent.Controls.Add(slider);
            y += 32;

            return lblVal;
        }

        private CustomButton CreatePresetBtn(string text, int x, int y, EventHandler onClick)
        {
            CustomButton btn = new CustomButton();
            btn.Text = text;
            btn.NormalColor = colButtonDark;
            btn.HoverColor = colSoftMagenta;
            btn.TextCustomColor = colLavenderPastel;
            btn.Location = new Point(x, y);
            btn.Size = new Size(258, 36);
            btn.Click += (s, e) =>
            {
                onClick(s, e);
                btn.TextCustomColor = Color.White;
            };
            return btn;
        }

        // --- HARDWARE EKRAN MATRIX ENGINE ---
        private void ApplyHardwareColorMatrix()
        {
            if (!magEngineReady) return;

            float gamma = (float)(tbGamma.Value / 10.0);
            float vibrancePct = (float)(tbVibrance.Value / 100.0);
            float sat = 1.0f + (vibrancePct * 1.5f);

            float bOffset = (float)(tbBrightness.Value / 100.0f);
            float contrast = (float)(tbContrast.Value / 10.0);
            float cOffset = 0.5f * (1.0f - contrast);

            float multR = (float)(tbRed.Value / 10.0);
            float multG = (float)(tbGreen.Value / 10.0);
            float multB = (float)(tbBlue.Value / 10.0);

            float rw = 0.2126f;
            float gw = 0.7152f;
            float bw = 0.0722f;

            MAGCOLOREFFECT effect = new MAGCOLOREFFECT();
            effect.transform = new float[25];

            // Combined Gain per channel
            float gR = gamma * contrast * multR;
            float gG = gamma * contrast * multG;
            float gB = gamma * contrast * multB;

            // Saturation matrix blended with gain
            effect.transform[0] = ((1.0f - sat) * rw + sat) * gR;
            effect.transform[1] = ((1.0f - sat) * rw) * gG;
            effect.transform[2] = ((1.0f - sat) * rw) * gB;

            effect.transform[5] = ((1.0f - sat) * gw) * gR;
            effect.transform[6] = ((1.0f - sat) * gw + sat) * gG;
            effect.transform[7] = ((1.0f - sat) * gw) * gB;

            effect.transform[10] = ((1.0f - sat) * bw) * gR;
            effect.transform[11] = ((1.0f - sat) * bw) * gG;
            effect.transform[12] = ((1.0f - sat) * bw + sat) * gB;

            // Alpha
            effect.transform[18] = 1.0f;

            // Offsets (Row 4)
            effect.transform[20] = cOffset + bOffset;
            effect.transform[21] = cOffset + bOffset;
            effect.transform[22] = cOffset + bOffset;
            effect.transform[24] = 1.0f;

            MagSetFullscreenColorEffect(ref effect);

            if (lblStatusIndicator != null)
            {
                lblStatusIndicator.Text = string.Format("● EKRAN GÜNCEL (GAMA: {0:0.0}x - CANLILIK: %{1})", gamma, tbVibrance.Value);
            }
        }

        // SADECE GAMA FULLEME
        private void ToggleFullDccwOnly()
        {
            isMaxGammaActive = !isMaxGammaActive;
            if (isMaxGammaActive)
            {
                tbGamma.Value = 40; // Max Gamma
                btnFullDccw.Text = "🔥 MAX DCCW (AKTİF)";
                btnFullDccw.NormalColor = colSoftMagenta;
                btnFullDccw.TextCustomColor = Color.White;
            }
            else
            {
                tbGamma.Value = 10; // Normal Gamma
                btnFullDccw.Text = "🔥 MAX DCCW (SADECE GAMA)";
                btnFullDccw.NormalColor = colWarmCoral;
                btnFullDccw.TextCustomColor = Color.White;
            }
            ApplyHardwareColorMatrix();
        }

        private void ResetToDefault()
        {
            isMaxGammaActive = false;
            isVibranceActive = false;
            tbGamma.Value = 10;
            tbVibrance.Value = 0;
            tbBrightness.Value = 0;
            tbContrast.Value = 10;
            tbRed.Value = 10;
            tbGreen.Value = 10;
            tbBlue.Value = 10;

            btnFullDccw.Text = "🔥 MAX DCCW (SADECE GAMA)";
            btnFullDccw.NormalColor = colWarmCoral;
            btnFullDccw.TextCustomColor = Color.White;

            if (magEngineReady)
            {
                MAGCOLOREFFECT identity = new MAGCOLOREFFECT();
                identity.transform = new float[25];
                identity.transform[0] = 1.0f;
                identity.transform[6] = 1.0f;
                identity.transform[12] = 1.0f;
                identity.transform[18] = 1.0f;
                identity.transform[24] = 1.0f;
                MagSetFullscreenColorEffect(ref identity);
            }
        }

        private void LoadPreset(int gamma, int vibrance, int brightness, int contrast, int r, int g, int b)
        {
            tbGamma.Value = gamma;
            tbVibrance.Value = vibrance;
            tbBrightness.Value = brightness;
            tbContrast.Value = contrast;
            tbRed.Value = r;
            tbGreen.Value = g;
            tbBlue.Value = b;
            ApplyHardwareColorMatrix();
        }

        // --- HOTKEYS ENGINE & BINDING ---
        private void RegisterGlobalHotkeys()
        {
            UnregisterHotKey(this.Handle, HOTKEY_ID_MAX_GAMMA);
            UnregisterHotKey(this.Handle, HOTKEY_ID_TOGGLE_VIBRANCE);

            RegisterHotKey(this.Handle, HOTKEY_ID_MAX_GAMMA, 0, (uint)hotkeyGamma);
            RegisterHotKey(this.Handle, HOTKEY_ID_TOGGLE_VIBRANCE, 0, (uint)hotkeyVibrance);

            btnBindGammaKey.Text = hotkeyGamma.ToString() + " (Değiştir)";
            btnBindVibranceKey.Text = hotkeyVibrance.ToString() + " (Değiştir)";
        }

        private void StartBindingGamma()
        {
            isBindingGamma = true;
            isBindingVibrance = false;
            btnBindGammaKey.Text = "Tuşa Basın...";
            btnBindGammaKey.NormalColor = colWarmCoral;
            btnBindGammaKey.TextCustomColor = Color.White;
        }

        private void StartBindingVibrance()
        {
            isBindingVibrance = true;
            isBindingGamma = false;
            btnBindVibranceKey.Text = "Tuşa Basın...";
            btnBindVibranceKey.NormalColor = colWarmCoral;
            btnBindVibranceKey.TextCustomColor = Color.White;
        }

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            if (isBindingGamma)
            {
                hotkeyGamma = keyData;
                isBindingGamma = false;
                btnBindGammaKey.NormalColor = Color.FromArgb(140, 122, 230);
                btnBindGammaKey.TextCustomColor = Color.White;
                RegisterGlobalHotkeys();
                SaveConfig();
                return true;
            }
            if (isBindingVibrance)
            {
                hotkeyVibrance = keyData;
                isBindingVibrance = false;
                btnBindVibranceKey.NormalColor = colSoftMagenta;
                btnBindVibranceKey.TextCustomColor = Color.White;
                RegisterGlobalHotkeys();
                SaveConfig();
                return true;
            }
            return base.ProcessCmdKey(ref msg, keyData);
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WM_HOTKEY)
            {
                int id = m.WParam.ToInt32();
                if (id == HOTKEY_ID_MAX_GAMMA)
                {
                    ToggleFullDccwOnly();
                }
                else if (id == HOTKEY_ID_TOGGLE_VIBRANCE)
                {
                    isVibranceActive = !isVibranceActive;
                    tbVibrance.Value = isVibranceActive ? 100 : 0;
                    ApplyHardwareColorMatrix();
                }
            }
            base.WndProc(ref m);
        }

        // --- SYSTEM TRAY INTEGRATION (CUSTOM LOGO & CUTE DARK MENU) ---
        private void HideToTray()
        {
            this.Hide();
            if (trayIcon != null)
            {
                trayIcon.ShowBalloonTip(1500, "DustFX", "Uygulama gizli simgelerde çalışıyor. Tuş atamaları aktif!", ToolTipIcon.Info);
            }
        }

        private void ShowFromTray()
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.Activate();
        }

        private void ExitApplicationCompletely()
        {
            isExplicitExit = true;
            UnregisterHotKey(this.Handle, HOTKEY_ID_MAX_GAMMA);
            UnregisterHotKey(this.Handle, HOTKEY_ID_TOGGLE_VIBRANCE);
            ResetToDefault();
            if (magEngineReady) MagUninitialize();
            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }
            Application.Exit();
        }

        private void CreateTrayIcon()
        {
            ContextMenuStrip trayMenu = new ContextMenuStrip();
            trayMenu.Renderer = new CustomMenuRenderer();
            trayMenu.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            trayMenu.ForeColor = Color.FromArgb(245, 246, 250);

            ToolStripMenuItem itemShow = new ToolStripMenuItem("⚡ DustFX'i Göster", null, (s, e) => ShowFromTray());
            ToolStripMenuItem itemToggle = new ToolStripMenuItem("🔥 Max DCCW (Aç/Kapat)", null, (s, e) => ToggleFullDccwOnly());
            ToolStripMenuItem itemReset = new ToolStripMenuItem("🔄 Sıfırla", null, (s, e) => ResetToDefault());
            ToolStripMenuItem itemExit = new ToolStripMenuItem("✕ Çıkış (Exit)", null, (s, e) => ExitApplicationCompletely());

            itemShow.ForeColor = colSoftMagenta;
            itemToggle.ForeColor = colWarmCoral;
            itemReset.ForeColor = colLavenderPastel;
            itemExit.ForeColor = Color.FromArgb(255, 120, 120);

            trayMenu.Items.Add(itemShow);
            trayMenu.Items.Add(itemToggle);
            trayMenu.Items.Add(itemReset);
            trayMenu.Items.Add(new ToolStripSeparator());
            trayMenu.Items.Add(itemExit);

            trayIcon = new NotifyIcon();
            trayIcon.Text = "DustFX - Visual Enhancer (Tuş Atamaları Aktif)";
            trayIcon.Icon = appIcon ?? SystemIcons.Shield; // LOGO ENTEGRASYONU!
            trayIcon.ContextMenuStrip = trayMenu;
            trayIcon.Visible = true;
            trayIcon.DoubleClick += (s, e) => ShowFromTray();
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (!isExplicitExit && e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                HideToTray();
                return;
            }

            UnregisterHotKey(this.Handle, HOTKEY_ID_MAX_GAMMA);
            UnregisterHotKey(this.Handle, HOTKEY_ID_TOGGLE_VIBRANCE);
            ResetToDefault();
            if (magEngineReady) MagUninitialize();
            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }
        }
    }
}
