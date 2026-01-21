import { useState } from "react";
import { trpc } from "../lib/trpc";
import { 
  QrCode, Share2, Mail, Users, Video, Apple, Activity, 
  GraduationCap, Headphones, Plus, CheckCircle, Clock, AlertCircle 
} from "lucide-react";

export default function FeaturesHub() {
  const [activeTab, setActiveTab] = useState<string>("qr-checkin");

  const features = [
    {
      id: "qr-checkin",
      name: "QR Check-In",
      icon: QrCode,
      description: "Attendance tracking with QR codes",
      color: "bg-blue-500",
    },
    {
      id: "social-media",
      name: "Social Media",
      icon: Share2,
      description: "Auto-post to Instagram, Facebook, Twitter",
      color: "bg-purple-500",
    },
    {
      id: "email-campaigns",
      name: "Email Campaigns",
      icon: Mail,
      description: "Automated email drip campaigns",
      color: "bg-green-500",
    },
    {
      id: "referrals",
      name: "Referral Program",
      icon: Users,
      description: "Track referrals and rewards",
      color: "bg-yellow-500",
    },
    {
      id: "scout-network",
      name: "AI Scout Network",
      icon: Video,
      description: "Global talent identification with AI",
      color: "bg-red-500",
    },
    {
      id: "nutrition-ai",
      name: "Nutrition AI",
      icon: Apple,
      description: "Meal photo recognition & analysis",
      color: "bg-orange-500",
    },
    {
      id: "injury-prevention",
      name: "Injury Prevention",
      icon: Activity,
      description: "Predictive analytics for injuries",
      color: "bg-pink-500",
    },
    {
      id: "education-academy",
      name: "Parent Academy",
      icon: GraduationCap,
      description: "Educational courses for parents",
      color: "bg-indigo-500",
    },
    {
      id: "vr-training",
      name: "VR Training",
      icon: Headphones,
      description: "Meta Quest VR training modules",
      color: "bg-cyan-500",
    },
  ];

  const activeFeature = features.find((f) => f.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Advanced Features Hub
          </h1>
          <p className="text-gray-400">
            Manage all 9 advanced features from one central dashboard
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`p-6 rounded-xl transition-all duration-300 ${
                  activeTab === feature.id
                    ? "bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-blue-500 shadow-lg shadow-blue-500/50 scale-105"
                    : "bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:bg-gray-800"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg mb-1">{feature.name}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Feature Content */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
          {activeTab === "qr-checkin" && <QRCheckInPanel />}
          {activeTab === "social-media" && <SocialMediaPanel />}
          {activeTab === "email-campaigns" && <EmailCampaignsPanel />}
          {activeTab === "referrals" && <ReferralPanel />}
          {activeTab === "scout-network" && <ScoutNetworkPanel />}
          {activeTab === "nutrition-ai" && <NutritionAIPanel />}
          {activeTab === "injury-prevention" && <InjuryPreventionPanel />}
          {activeTab === "education-academy" && <EducationAcademyPanel />}
          {activeTab === "vr-training" && <VRTrainingPanel />}
        </div>
      </div>
    </div>
  );
}

// ==================== QR CHECK-IN PANEL ====================
function QRCheckInPanel() {
  const [sessionId, setSessionId] = useState("");
  const [location, setLocation] = useState("");
  const [qrCode, setQrCode] = useState("");

  const generateQR = trpc.qrCheckIn.generateQR.useMutation();

  const handleGenerateQR = async () => {
    const result = await generateQR.mutateAsync({
      sessionId: parseInt(sessionId),
      location,
    });
    setQrCode(result.qrCode);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <QrCode className="w-6 h-6" />
        QR Code Check-In System
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Session ID</label>
            <input
              type="number"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter session ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Training ground, Field A, etc."
            />
          </div>

          <button
            onClick={handleGenerateQR}
            disabled={!sessionId || !location}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            Generate QR Code
          </button>
        </div>

        <div className="flex items-center justify-center">
          {qrCode ? (
            <div className="text-center">
              <div className="bg-white p-8 rounded-lg inline-block mb-4">
                <div className="text-6xl font-mono text-black">{qrCode.slice(-6)}</div>
              </div>
              <p className="text-sm text-gray-400">QR Code: {qrCode}</p>
              <p className="text-xs text-gray-500 mt-2">
                Players scan this code to check in
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <QrCode className="w-24 h-24 mx-auto mb-4 opacity-20" />
              <p>Generate a QR code to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== SOCIAL MEDIA PANEL ====================
function SocialMediaPanel() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);

  const createPost = trpc.socialMedia.createPost.useMutation();
  const { data: posts } = trpc.socialMedia.getPosts.useQuery({ limit: 10 });

  const handleCreatePost = async () => {
    await createPost.mutateAsync({
      title,
      content,
      platforms: platforms as any,
    });
    setTitle("");
    setContent("");
    setPlatforms([]);
  };

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Share2 className="w-6 h-6" />
        Social Media Auto-Posting
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Post Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Amazing training session today!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Write your post content..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {["instagram", "facebook", "twitter", "linkedin"].map((platform) => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    platforms.includes(platform)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreatePost}
            disabled={!title || !content || platforms.length === 0}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            Create Post
          </button>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Recent Posts</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {posts?.map((post) => (
              <div key={post.id} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{post.title}</h4>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      post.status === "posted"
                        ? "bg-green-500/20 text-green-400"
                        : post.status === "scheduled"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{post.content}</p>
                <div className="flex gap-2 mt-2">
                  {(post.platforms as string[])?.map((platform) => (
                    <span
                      key={platform}
                      className="text-xs px-2 py-1 bg-gray-600 rounded"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== EMAIL CAMPAIGNS PANEL ====================
function EmailCampaignsPanel() {
  const [campaignName, setCampaignName] = useState("");
  const [targetAudience, setTargetAudience] = useState("new_players");

  const createCampaign = trpc.emailCampaigns.createCampaign.useMutation();
  const { data: campaigns } = trpc.emailCampaigns.getCampaigns.useQuery();

  const handleCreateCampaign = async () => {
    await createCampaign.mutateAsync({
      name: campaignName,
      targetAudience: targetAudience as any,
    });
    setCampaignName("");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Mail className="w-6 h-6" />
        Email Drip Campaigns
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="New Player Welcome Series"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Audience</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="new_players">New Players</option>
              <option value="new_parents">New Parents</option>
              <option value="all_players">All Players</option>
              <option value="all_parents">All Parents</option>
              <option value="coaches">Coaches</option>
            </select>
          </div>

          <button
            onClick={handleCreateCampaign}
            disabled={!campaignName}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            Create Campaign
          </button>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-blue-400">How it works</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Create a campaign with target audience</li>
              <li>• Add email templates in sequence</li>
              <li>• Set delay days between emails</li>
              <li>• Activate to start sending automatically</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Active Campaigns</h3>
          <div className="space-y-3">
            {campaigns?.map((campaign) => (
              <div key={campaign.id} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{campaign.name}</h4>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      campaign.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Target: {campaign.targetAudience?.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== REFERRAL PANEL ====================
function ReferralPanel() {
  const [referralCode, setReferralCode] = useState("");
  const [referredEmail, setReferredEmail] = useState("");

  const generateCode = trpc.referral.generateCode.useMutation();
  const createReferral = trpc.referral.createReferral.useMutation();
  const { data: myReferrals } = trpc.referral.getMyReferrals.useQuery();

  const handleGenerateCode = async () => {
    const result = await generateCode.mutateAsync();
    setReferralCode(result.referralCode);
  };

  const handleCreateReferral = async () => {
    await createReferral.mutateAsync({
      referralCode,
      referredEmail,
    });
    setReferredEmail("");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-6 h-6" />
        Referral Program
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">Your Referral Code</h3>
            {referralCode ? (
              <div className="bg-gray-900 px-4 py-3 rounded-lg font-mono text-2xl text-center">
                {referralCode}
              </div>
            ) : (
              <button
                onClick={handleGenerateCode}
                className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors"
              >
                Generate My Code
              </button>
            )}
          </div>

          {referralCode && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Refer Someone
                </label>
                <input
                  type="email"
                  value={referredEmail}
                  onChange={(e) => setReferredEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="friend@email.com"
                />
              </div>
              <button
                onClick={handleCreateReferral}
                disabled={!referredEmail}
                className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                Send Referral
              </button>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-blue-400">Rewards</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 20% discount on next month</li>
              <li>• 1 free private training session</li>
              <li>• 100 loyalty points</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">My Referrals</h3>
          <div className="space-y-3">
            {myReferrals?.map((referral) => (
              <div key={referral.id} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{referral.referredEmail}</p>
                    <p className="text-sm text-gray-400">{referral.referredName}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      referral.status === "rewarded"
                        ? "bg-green-500/20 text-green-400"
                        : referral.status === "completed"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {referral.status}
                  </span>
                </div>
                {referral.rewardType && (
                  <p className="text-sm text-yellow-400">
                    Reward: {referral.rewardValue} {referral.rewardType}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SCOUT NETWORK PANEL ====================
function ScoutNetworkPanel() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Video className="w-6 h-6" />
        AI Scout Network
      </h2>
      <div className="text-center py-12">
        <Video className="w-24 h-24 mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-semibold mb-2">Global Talent Identification</h3>
        <p className="text-gray-400 mb-6">
          Upload player videos for AI-powered scouting analysis across 20 metrics
        </p>
        <button className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors">
          Create Scout Report
        </button>
      </div>
    </div>
  );
}

// ==================== NUTRITION AI PANEL ====================
function NutritionAIPanel() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Apple className="w-6 h-6" />
        Nutrition AI
      </h2>
      <div className="text-center py-12">
        <Apple className="w-24 h-24 mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-semibold mb-2">Meal Photo Recognition</h3>
        <p className="text-gray-400 mb-6">
          Take a photo of your meal and get instant nutritional analysis
        </p>
        <button className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors">
          Log Meal
        </button>
      </div>
    </div>
  );
}

// ==================== INJURY PREVENTION PANEL ====================
function InjuryPreventionPanel() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Activity className="w-6 h-6" />
        Injury Prevention AI
      </h2>
      <div className="text-center py-12">
        <Activity className="w-24 h-24 mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-semibold mb-2">Predictive Analytics</h3>
        <p className="text-gray-400 mb-6">
          AI-powered injury risk assessment based on training load and recovery
        </p>
        <button className="px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-colors">
          Run Assessment
        </button>
      </div>
    </div>
  );
}

// ==================== EDUCATION ACADEMY PANEL ====================
function EducationAcademyPanel() {
  const { data: courses } = trpc.educationAcademy.getCourses.useQuery({});

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <GraduationCap className="w-6 h-6" />
        Parent Education Academy
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses?.map((course) => (
          <div key={course.id} className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{course.title}</h3>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {course.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded">
                {course.category?.replace("_", " ")}
              </span>
              <button className="text-sm text-indigo-400 hover:text-indigo-300">
                Enroll →
              </button>
            </div>
          </div>
        ))}
        {(!courses || courses.length === 0) && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No courses available yet
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== VR TRAINING PANEL ====================
function VRTrainingPanel() {
  const { data: scenarios } = trpc.vrTraining.getScenarios.useQuery({});

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Headphones className="w-6 h-6" />
        VR Training Modules
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios?.map((scenario) => (
          <div key={scenario.id} className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{scenario.title}</h3>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {scenario.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                {scenario.scenarioType}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-600 rounded">
                {scenario.difficulty}
              </span>
            </div>
          </div>
        ))}
        {(!scenarios || scenarios.length === 0) && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No VR scenarios available yet
          </div>
        )}
      </div>
    </div>
  );
}
