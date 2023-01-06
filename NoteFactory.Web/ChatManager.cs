using System.Diagnostics;
using System.Xml.Linq;

namespace NoteFactory.Web
{
    //a silly manager layer just to have something to call
    public interface IChatManager
    {
        Chat? GetChat(string id);
        Chat CreateChat(string id);
        void DeleteChat(string id);
    }

    public class Participant
    {
        public Participant(int id, string name)
        {
            Id = id;
            Name = name;
        }

        public int Id { get; private set; }
        public string Name { get; private set; }        
    }

    public class Message
    {
        Func<int, string> _nameResolver;
        public Message(DateTime sentAt, int sentBy, string sentByName, string text)
        {
            SentAt = sentAt;
            SentBy = sentBy;
            SentByName = sentByName;
            Text = text;
        }

        public DateTime SentAt { get; private set; }
        public int SentBy { get; private set; }

        public string SentByName { get; private set; }
        public string Text { get; private set; }
    }

    public class Chat
    {
        const int SystemId = 0;
        public Chat(string id)
        {
            Id = id;
            _participants = new List<Participant>();
            _messages = new List<Message>();
            LastUpdated = DateTime.Now;

            _participants.Add(new Participant(SystemId, "System"));
        }

        public string Id { get; private set; }
        List<Participant> _participants;
        List<Message> _messages;
        public IEnumerable<Participant> Participants { get { return _participants; } }
        public IEnumerable<Message> Messages { get { return _messages; } }

        public DateTime LastUpdated { get; private set; }

        public bool IsEmpty { get { return _participants.Count == 1; } }

        public void AppendMessage(int sentBy, string text)
        {
            var m = 
                new Message(DateTime.Now, sentBy, 
                    Participants.FirstOrDefault(p => p.Id == sentBy)?.Name ?? sentBy.ToString(),
                    text);
            _messages.Add(m);
            LastUpdated = m.SentAt;
        }

        static int _participantId = 100;
        public Participant AddParticipant(string name)
        {
            var p = new Participant(_participantId++, name);
            _participants.Add(p);

            AppendMessage(SystemId, $"{name} joined the chat");

            return p;
        }

        public void RemoveParticipant(int id) 
        { 
            var p = _participants.SingleOrDefault(p => p.Id == id);
            if (p != null)
            {
                _participants.Remove(p);
                AppendMessage(SystemId, $"{p.Name} left the chat");
            }
        }

        public IEnumerable<Message> MessagesSince(DateTime sentAt) 
        {
            return _messages.Where(m => m.SentAt > sentAt);
        }

    }
    public class ChatManager : IChatManager
    {
        Dictionary<string, Chat> _chatsById = new Dictionary<string, Chat>();
        public Chat CreateChat(string id)
        {
            var c = new Chat(id);
            _chatsById[id] = c;
            return c;
        }

        public void DeleteChat(string id)
        {
            if(_chatsById.ContainsKey(id))
            {
                _chatsById.Remove(id);
            }
        }

        public Chat? GetChat(string id)
        {
            return _chatsById.GetValueOrDefault(id);
        }
    }
}
